const db = require('../config/db');

class Note {
  static async getByClientId(clientId) {
    const [rows] = await db.query(`
      SELECT 
        client_notes.*,
        users.name AS author_name
      FROM client_notes
      LEFT JOIN users ON users.id = client_notes.user_id
      WHERE client_notes.client_id = ?
      ORDER BY client_notes.created_at DESC
    `, [clientId]);
    return rows;
  }

  static async create(data) {
    const { client_id, user_id, content } = data;
    const [result] = await db.query(
      `INSERT INTO client_notes (client_id, user_id, content) VALUES (?, ?, ?)`,
      [client_id, user_id, content]
    );
    return result.insertId;
  }
}

module.exports = Note;
