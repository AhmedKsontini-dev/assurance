const db = require('../config/db');

class Category {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name ASC');
    return rows;
  }

  static async create(name) {
    const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name]);
    return result.insertId;
  }

  static async delete(id) {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
  }
}

module.exports = Category;
