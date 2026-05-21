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

    if (filters.date) {
      query += ' AND DATE(expense_date) = ?';
      params.push(filters.date);
    }

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.startDate) {
      query += ' AND expense_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND expense_date <= ?';
      params.push(filters.endDate);
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

  /**
   * Get upcoming expenses within the next 3 days (excluding past dates)
   * Used for Dashboard reminder banner
   */
  static async getUpcomingExpenses(userId) {
    const [rows] = await db.query(
      `SELECT * FROM expenses
       WHERE user_id = ?
         AND DATE(expense_date) >= CURDATE()
         AND DATE(expense_date) <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ORDER BY expense_date ASC`,
      [userId]
    );
    return rows;
  }

  static async getStatsByUserId(userId, filters = {}) {
    let dateCondition = '';
    let params = [userId];

    if (filters.date) {
      dateCondition += ' AND DATE(expense_date) = ?';
      params.push(filters.date);
    }

    if (filters.startDate) {
      dateCondition += ' AND expense_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      dateCondition += ' AND expense_date <= ?';
      params.push(filters.endDate);
    }

    const queries = {
      today: `SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND DATE(expense_date) = CURDATE()`,
      thisMonth: `SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())`,
      thisYear: `SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND YEAR(expense_date) = YEAR(CURDATE())`,
      overall: `SELECT SUM(amount) as total FROM expenses WHERE user_id = ?`,
      filtered: (filters.startDate || filters.endDate || filters.date) ? `SELECT SUM(amount) as total FROM expenses WHERE user_id = ? ${dateCondition}` : null,
      byCategory: `SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? ${dateCondition} GROUP BY category ORDER BY total DESC`
    };

    const stats = {};
    for (const [key, sql] of Object.entries(queries)) {
      if (!sql) continue;
      
      let currentParams = [...params];
      if (key === 'today' || key === 'thisMonth' || key === 'thisYear' || key === 'overall') {
        currentParams = [userId]; // These are fixed ranges
      }

      const [rows] = await db.query(sql, currentParams);
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
