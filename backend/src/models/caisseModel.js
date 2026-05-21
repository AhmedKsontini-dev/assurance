const db = require('../config/db');

class Caisse {
  /**
   * Initialize the caisse tables if they don't exist
   */
  static async initTables() {
    // New unified caisse entries table
    await db.query(`
      CREATE TABLE IF NOT EXISTS caisse_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        montant DECIMAL(10, 3) NOT NULL,
        type ENUM('INCOME', 'EXPENSE') NOT NULL,
        description VARCHAR(255) NOT NULL,
        date_operation DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Caisse tables initialized');
  }

  /**
   * Add a new entry
   */
  static async addEntry(userId, data) {
    const { montant, type, description, date_operation } = data;

    const [result] = await db.query(
      'INSERT INTO caisse_entries (user_id, montant, type, description, date_operation) VALUES (?, ?, ?, ?, ?)',
      [userId, montant, type, description, date_operation]
    );

    const [newEntry] = await db.query(
      'SELECT * FROM caisse_entries WHERE id = ?',
      [result.insertId]
    );

    return newEntry[0];
  }

  /**
   * Get entries for a user with pagination and optional date filter
   */
  static async getEntries(userId, limit = 50, date = null) {
    let query = 'SELECT * FROM caisse_entries WHERE user_id = ?';
    let params = [userId];

    if (date) {
      query += ' AND date_operation = ?';
      params.push(date);
    }

    query += ' ORDER BY date_operation DESC, created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(query, params);
    return rows;
  }

  /**
   * Delete an entry
   */
  static async deleteEntry(id, userId) {
    const [result] = await db.query(
      'DELETE FROM caisse_entries WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Get aggregated summary for a user
   */
  static async getOverallSummary(userId) {
    const [rows] = await db.query(
      `SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN montant ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'EXPENSE' THEN montant ELSE 0 END) as total_expense
       FROM caisse_entries 
       WHERE user_id = ?`,
      [userId]
    );

    const total_income = parseFloat(rows[0].total_income || 0);
    const total_expense = parseFloat(rows[0].total_expense || 0);

    return {
      total_income,
      total_expense,
      solde: total_income - total_expense
    };
  }

  /**
   * Get daily summary (for backward compatibility if needed, but updated for new schema)
   */
  static async getDailySummary(userId, date) {
    const overall = await this.getOverallSummary(userId);
    
    // You could also add today-specific summary if needed
    const [todayRows] = await db.query(
      `SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN montant ELSE 0 END) as today_income,
        SUM(CASE WHEN type = 'EXPENSE' THEN montant ELSE 0 END) as today_expense
       FROM caisse_entries 
       WHERE user_id = ? AND date_operation = ?`,
      [userId, date]
    );

    return {
      overall,
      today: {
        income: parseFloat(todayRows[0].today_income || 0),
        expense: parseFloat(todayRows[0].today_expense || 0),
        date
      }
    };
  }
}

module.exports = Caisse;
