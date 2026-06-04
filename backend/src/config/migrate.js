const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateDB = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('🔄 Début de la migration...');

    // Add reste_a_payer to clients
    try {
      await connection.query('ALTER TABLE clients ADD COLUMN reste_a_payer DECIMAL(10, 2) DEFAULT 0.00;');
      console.log('✅ Colonne reste_a_payer ajoutée à clients');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Erreur:', e.message);
    }

    // Add is_deleted to clients
    try {
      await connection.query('ALTER TABLE clients ADD COLUMN is_deleted BOOLEAN DEFAULT 0;');
      console.log('✅ Colonne is_deleted ajoutée à clients');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Erreur:', e.message);
    }

    // Initialize reste_a_payer
    try {
      await connection.query('UPDATE clients SET reste_a_payer = IFNULL(total, 0) - IFNULL(montant_paye, 0);');
      console.log('✅ reste_a_payer initialisé avec succès');
    } catch (e) {
      console.error('Erreur:', e.message);
    }

    // Add annule to client_versements
    try {
      await connection.query('ALTER TABLE client_versements ADD COLUMN annule BOOLEAN DEFAULT 0;');
      console.log('✅ Colonne annule ajoutée à client_versements');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('Erreur:', e.message);
    }

    // Change ON DELETE CASCADE to ON DELETE RESTRICT in client_versements
    // This requires finding the foreign key constraint name and dropping it.
    try {
      const [rows] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'client_versements' 
          AND TABLE_SCHEMA = '${process.env.DB_NAME}' 
          AND COLUMN_NAME = 'client_id' 
          AND REFERENCED_TABLE_NAME = 'clients';
      `);
      if (rows.length > 0) {
        const constraintName = rows[0].CONSTRAINT_NAME;
        await connection.query(`ALTER TABLE client_versements DROP FOREIGN KEY ${constraintName};`);
        await connection.query('ALTER TABLE client_versements ADD CONSTRAINT fk_client_versement FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;');
        console.log('✅ Clé étrangère client_versements modifiée avec ON DELETE RESTRICT');
      }
    } catch (e) {
      console.error('Erreur fk:', e.message);
    }

    console.log('🎉 Migration terminée !');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la migration:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

migrateDB();
