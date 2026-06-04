const db = require('./src/config/db');

async function createTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS client_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NULL,
        utilisateur_id INT NOT NULL,
        nom_utilisateur VARCHAR(255) NOT NULL,
        action_effectuee VARCHAR(255) NOT NULL,
        ancienne_valeur TEXT NULL,
        nouvelle_valeur TEXT NULL,
        date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Table client_history créée avec succès');

    // Vérification
    const [rows] = await db.query('SHOW TABLES LIKE "client_history"');
    if (rows.length > 0) {
      console.log('✅ Confirmation : table client_history existe en base');
    } else {
      console.log('❌ Problème : table non trouvée après création');
    }
  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    process.exit(0);
  }
}

createTable();
