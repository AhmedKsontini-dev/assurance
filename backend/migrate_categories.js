const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Starting categories migration...');
    
    // Create categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    // Insert default categories
    await db.query(`
      INSERT IGNORE INTO categories (name) 
      VALUES ('Agricole'), ('Bateau'), ('Maison')
    `);
    
    // Add category column to clients
    try {
      await db.query('ALTER TABLE clients ADD COLUMN category VARCHAR(100) DEFAULT NULL');
      console.log('✅ Added category column to clients table');
    } catch (err) {
      if (err.code === 'ER_DUP_COLUMNNAME') {
        console.log('ℹ️ Category column already exists in clients table');
      } else {
        throw err;
      }
    }
    
    console.log('✅ Categories migration successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
