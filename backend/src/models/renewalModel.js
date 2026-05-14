const db = require('../config/db');

class Renewal {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS client_renewals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        old_expiration_date DATE,
        new_expiration_date DATE NOT NULL,
        renewal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        admin_id INT NOT NULL,
        plan_duration VARCHAR(100),
        notes TEXT,
        status ENUM('Accepted', 'Refused', 'Follow-up') DEFAULT 'Accepted',
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await db.query(query);
  }

  static async create(data) {
    const {
      client_id, old_expiration_date, new_expiration_date,
      admin_id, plan_duration, notes, status
    } = data;

    const [result] = await db.query(
      `INSERT INTO client_renewals (
        client_id, old_expiration_date, new_expiration_date, 
        admin_id, plan_duration, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [client_id, old_expiration_date, new_expiration_date, admin_id, plan_duration, notes, status]
    );

    return result.insertId;
  }

  static async getByClientId(clientId) {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        u.name as admin_name
      FROM client_renewals r
      JOIN users u ON r.admin_id = u.id
      WHERE r.client_id = ?
      ORDER BY r.renewal_date DESC
    `, [clientId]);
    return rows;
  }

  static async getStats() {
    const [rows] = await db.query(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM client_renewals 
      GROUP BY status
    `);
    return rows;
  }
}

// Ensure table exists
Renewal.createTable().catch(err => console.error('Error creating client_renewals table:', err));

module.exports = Renewal;
