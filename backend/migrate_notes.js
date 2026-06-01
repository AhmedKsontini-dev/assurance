const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Création de la table client_notes...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS client_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
    `;
    await db.query(createTableQuery);
    console.log('✅ Table "client_notes" créée avec succès (MyISAM).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors de la création de la table client_notes :', err);
    process.exit(1);
  }
}

migrate();
