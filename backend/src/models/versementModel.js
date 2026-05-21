const db = require('../config/db');

class Versement {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS client_versements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        montant DECIMAL(10, 2) NOT NULL,
        date_versement DATE NOT NULL,
        methode_paiement VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await db.query(query);
  }

  static async create(data) {
    const { client_id, montant, date_versement, methode_paiement } = data;
    const [result] = await db.query(
      `INSERT INTO client_versements (client_id, montant, date_versement, methode_paiement) 
       VALUES (?, ?, ?, ?)`,
      [client_id, montant, date_versement, methode_paiement]
    );
    return result.insertId;
  }

  static async getByClientId(clientId) {
    const [rows] = await db.query(
      `SELECT * FROM client_versements 
       WHERE client_id = ? 
       ORDER BY date_versement DESC, created_at DESC`,
      [clientId]
    );
    return rows;
  }
}

// Ensure table exists
Versement.createTable().catch(err => console.error('Error creating client_versements table:', err));

module.exports = Versement;
