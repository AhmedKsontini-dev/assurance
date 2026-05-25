const db = require('../config/db');

class Client {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        clients.*,
        users.name AS creator_name
      FROM clients
      LEFT JOIN users 
        ON users.id = clients.created_by
    `;
    const params = [];

    if (filters.month) {
      query += ` WHERE DATE_FORMAT(clients.created_at, '%Y-%m') = ?`;
      params.push(filters.month);
    }

    query += ` ORDER BY clients.created_at DESC, clients.id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`
      SELECT 
        clients.*,
        users.name AS creator_name
      FROM clients
      LEFT JOIN users 
        ON users.id = clients.created_by
      WHERE clients.id = ?
    `, [id]);

    return rows[0];
  }

  static async create(data) {
    const toNum = (val) => (val === '' || val === undefined || val === null) ? null : parseFloat(val);
    const toDate = (val) => (val === '' || val === undefined || val === null) ? null : val;

    const {
      police, societaire, adresse, tel, paiement, montant,
      reduction, rc, papier, usage_vehicle, immatriculation,
      date_effet, date_expiration, total, created_by,
      payment_status, payment_date, payment_method, category,
      montant_paye, date_prochain_paiement, created_at
    } = data;

    const [result] = await db.query(
      `INSERT INTO clients (
        police, societaire, adresse, tel, paiement, montant, 
        reduction, rc, papier, usage_vehicle, immatriculation, 
        date_effet, date_expiration, total, created_by,
        payment_status, payment_date, payment_method, category,
        montant_paye, date_prochain_paiement, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [
        police || null,
        societaire || null,
        adresse || null,
        tel || null,
        paiement || null,
        toNum(montant),
        toNum(reduction),
        rc || null,
        papier || null,
        usage_vehicle || null,
        immatriculation || null,
        toDate(date_effet),
        toDate(date_expiration),
        toNum(total),
        created_by,
        payment_status || 'Unpaid',
        toDate(payment_date),
        payment_method || null,
        category || null,
        toNum(montant_paye) || 0.00,
        toDate(date_prochain_paiement),
        toDate(created_at)
      ]
    );

    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    const numFields = ['montant', 'reduction', 'total', 'montant_paye'];
    const dateFields = ['date_effet', 'date_expiration', 'payment_date', 'date_prochain_paiement', 'created_at'];

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        let val = data[key];

        // Sanitize empty strings or nulls for specific types
        if (val === '') {
          if (numFields.includes(key)) {
            val = key === 'montant_paye' ? 0.00 : null;
          } else if (dateFields.includes(key)) {
            val = null;
          }
        } else if (numFields.includes(key) && val !== null) {
          val = parseFloat(val);
        }

        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await db.query(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM clients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Get clients whose date_expiration is within `days` days from now
   * (includes already expired clients up to 30 days past).
   * Optimized: filtering is done at the DB level.
   */
  static async getExpiring(days = 10) {
    const [rows] = await db.query(
      `SELECT * FROM clients 
       WHERE date_expiration IS NOT NULL 
         AND date_expiration >= CURDATE() - INTERVAL 30 DAY
         AND date_expiration <= CURDATE() + INTERVAL ? DAY
         AND (renewal_status IS NULL OR renewal_status != 'Refused')
       ORDER BY date_expiration ASC`,
      [days]
    );
    return rows;
  }

  /**
   * Get count of clients expiring within `days` days (not yet expired).
   */
  static async getExpiringCount(days = 10) {
    const [rows] = await db.query(
      `SELECT COUNT(*) as count FROM clients 
       WHERE date_expiration IS NOT NULL 
         AND date_expiration >= CURDATE()
         AND date_expiration <= CURDATE() + INTERVAL ? DAY
         AND (renewal_status IS NULL OR renewal_status != 'Refused')`,
      [days]
    );
    return rows[0].count;
  }
}

module.exports = Client;