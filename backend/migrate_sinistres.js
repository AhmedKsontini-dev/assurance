const mysql = require('mysql2/promise');
require('dotenv').config();

const migrateSinistres = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const createSinistresTable = `
    CREATE TABLE IF NOT EXISTS sinistres (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero_police VARCHAR(100),
      nom_client VARCHAR(255),
      immatriculation VARCHAR(100),
      date_accident DATE,
      numero_sinistre VARCHAR(100),
      nom_expert VARCHAR(255),
      nature_sinistre VARCHAR(255),
      montant_rapport_expertise DECIMAL(15, 2),
      observation TEXT,
      rapport_cheque VARCHAR(255),
      date_cheque DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `;

    await connection.query(createSinistresTable);
    console.log('✅ Table "sinistres" created or ensured');

    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating sinistres table:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
};

migrateSinistres();
