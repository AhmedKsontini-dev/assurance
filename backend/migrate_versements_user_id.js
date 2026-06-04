const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Running database migration for client payments...');

    // 1. Add user_id column to client_versements if not exists
    try {
      await db.query(`
        ALTER TABLE client_versements 
        ADD COLUMN user_id INT NULL
      `);
      console.log('✅ Column "user_id" added to "client_versements".');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Column "user_id" already exists in "client_versements".');
      } else {
        throw err;
      }
    }

    // Add foreign key constraint if not exists
    try {
      await db.query(`
        ALTER TABLE client_versements 
        ADD CONSTRAINT fk_versement_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Foreign key constraint "fk_versement_user" added.');
    } catch (err) {
      console.log('ℹ️ Foreign key constraint might already exist or MyISAM table warning:', err.message);
    }

    // 2. Set user_id of existing versements to the client's creator (created_by) where user_id is null
    const [updateResult] = await db.query(`
      UPDATE client_versements v
      JOIN clients c ON v.client_id = c.id
      SET v.user_id = c.created_by
      WHERE v.user_id IS NULL
    `);
    console.log(`✅ Backfilled user_id for ${updateResult.affectedRows} existing versements.`);

    // 3. For all existing clients with montant_paye > 0, make sure their sum of versements equals montant_paye.
    // If there's a difference, create a versement for the difference with user_id = client.created_by
    const [clients] = await db.query('SELECT id, montant_paye, created_by, created_at, payment_date, paiement, payment_method FROM clients WHERE montant_paye > 0');
    console.log(`Found ${clients.length} clients with montant_paye > 0. Validating versements...`);

    let createdVersementsCount = 0;
    for (const client of clients) {
      const [versementStats] = await db.query(
        'SELECT COALESCE(SUM(montant), 0) as total_versements FROM client_versements WHERE client_id = ?',
        [client.id]
      );
      
      const totalPaid = parseFloat(client.montant_paye) || 0;
      const totalVersements = parseFloat(versementStats[0].total_versements) || 0;
      const diff = totalPaid - totalVersements;

      if (Math.abs(diff) > 0.01) { // Floating point comparison
        console.log(`Client ID ${client.id} has montant_paye = ${totalPaid} but sum of versements = ${totalVersements}. Difference = ${diff}`);
        // Create versement for the difference
        await db.query(
          `INSERT INTO client_versements (client_id, montant, date_versement, methode_paiement, user_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            client.id, 
            diff, 
            client.payment_date || client.created_at || new Date().toISOString().split('T')[0],
            client.payment_method || client.paiement || 'Espece',
            client.created_by
          ]
        );
        createdVersementsCount++;
      }
    }
    console.log(`✅ Created ${createdVersementsCount} missing versement records for initial payments.`);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
