const db = require('../config/db');

class User {
  static async create(data) {
    const { name, email, password, role, can_add, can_edit, can_delete } = data;
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, can_add, can_edit, can_delete) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name, 
        email, 
        password, 
        role || 'EMPLOYEE',
        can_add !== undefined ? can_add : true,
        can_edit !== undefined ? can_edit : true,
        can_delete !== undefined ? can_delete : true
      ]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT id, name, email, role, can_add, can_edit, can_delete, last_active, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  static async getAll() {
    const [rows] = await db.query('SELECT id, name, email, role, can_add, can_edit, can_delete, last_active, created_at FROM users');
    return rows;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async update(id, data) {
    const { name, email, role, can_add, can_edit, can_delete } = data;
    
    // Dynamically build update query based on provided fields
    let query = 'UPDATE users SET name = ?, email = ?, role = ?';
    let params = [name, email, role];

    if (can_add !== undefined) { query += ', can_add = ?'; params.push(can_add); }
    if (can_edit !== undefined) { query += ', can_edit = ?'; params.push(can_edit); }
    if (can_delete !== undefined) { query += ', can_delete = ?'; params.push(can_delete); }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await db.query(query, params);
    return result.affectedRows > 0;
  }

  static async updatePassword(id, hashedPassword) {
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
