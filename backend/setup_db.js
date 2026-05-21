const db = require('./src/config/db');

async function setup() {
  try {
    console.log('Starting simplified database setup...');
    
    // 1. Create table without constraints
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS client_renewals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        old_expiration_date DATE,
        new_expiration_date DATE NOT NULL,
        renewal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_id INT NOT NULL,
        plan_duration VARCHAR(100),
        notes TEXT,
        status ENUM('Accepted', 'Refused', 'Follow-up') DEFAULT 'Accepted'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    
    await db.query(createTableQuery);
    console.log('✅ Table "client_renewals" created.');

    // 2. Try adding foreign key for client_id
    try {
      await db.query(`
        ALTER TABLE client_renewals 
        ADD CONSTRAINT fk_renewal_client 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key for "client_id" added.');
    } catch (fkErr) {
      console.error('❌ Error adding foreign key for client_id:', fkErr.message);
    }

    // 3. Try adding foreign key for admin_id
    try {
      await db.query(`
        ALTER TABLE client_renewals 
        ADD CONSTRAINT fk_renewal_admin 
        FOREIGN KEY (admin_id) REFERENCES users(id)
      `);
      console.log('✅ Foreign key for "admin_id" added.');
    } catch (fkErr) {
      console.error('❌ Error adding foreign key for admin_id:', fkErr.message);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during setup:', err);
    process.exit(1);
  }
}

setup();
