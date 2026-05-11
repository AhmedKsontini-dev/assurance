const db = require('../config/db');

class Expense {
  static async create(data) {
    const { user_id, category, amount, description, payment_method, expense_date } = data;
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, category, amount, description, payment_method, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, category, amount, description, payment_method, expense_date]
    );
    return result.insertId;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM expenses WHERE id = ?', [id]);
    return rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    let params = [userId];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.startDate && filters.endDate) {
      query += ' AND expense_date BETWEEN ? AND ?';
      params.push(filters.startDate, filters.endDate);
    }

    if (filters.search) {
      query += ' AND (description LIKE ? OR category LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY expense_date DESC, created_at DESC';

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async update(id, data) {
    const { category, amount, description, payment_method, expense_date } = data;
    const [result] = await db.query(
      'UPDATE expenses SET category = ?, amount = ?, description = ?, payment_method = ?, expense_date = ? WHERE id = ?',
      [category, amount, description, payment_method, expense_date, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM expenses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getStatsByUserId(userId) {
    const queries = {
      today: 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND DATE(expense_date) = CURDATE()',
      thisMonth: 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())',
      thisYear: 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND YEAR(expense_date) = YEAR(CURDATE())',
      overall: 'SELECT SUM(amount) as total FROM expenses WHERE user_id = ?',
      byCategory: 'SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC'
    };

    const stats = {};
    for (const [key, sql] of Object.entries(queries)) {
      const [rows] = await db.query(sql, [userId]);
      if (key === 'byCategory') {
        stats[key] = rows;
      } else {
        stats[key] = rows[0]?.total || 0;
      }
    }
    return stats;
  }
}

module.exports = Expense;
