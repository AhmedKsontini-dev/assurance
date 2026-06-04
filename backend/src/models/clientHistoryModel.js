const db = require('../config/db');

class ClientHistory {
  static async initTable() {
    const query = `
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
    `;
    await db.query(query);
    console.log('✅ ClientHistory table initialized');
  }

  static async create(data) {
    const { client_id, utilisateur_id, nom_utilisateur, action_effectuee, ancienne_valeur, nouvelle_valeur } = data;
    
    // Convert boolean/object values to strings if necessary
    const parseVal = (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    const [result] = await db.query(
      `INSERT INTO client_history (client_id, utilisateur_id, nom_utilisateur, action_effectuee, ancienne_valeur, nouvelle_valeur)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [client_id, utilisateur_id, nom_utilisateur, action_effectuee, parseVal(ancienne_valeur), parseVal(nouvelle_valeur)]
    );
    return result.insertId;
  }

  static async getByClientId(clientId) {
    const [rows] = await db.query(
      `SELECT * FROM client_history 
       WHERE client_id = ? 
       ORDER BY date_modification DESC`,
      [clientId]
    );
    return rows;
  }
}

module.exports = ClientHistory;
