const db = require('../config/db');

class Client {
  static async getAll(filters = {}) {
    let query = `
      SELECT 
        clients.*,
        users.name AS creator_name,
        MIN(pt.date_echeance) AS prochaine_echeance
      FROM clients
      LEFT JOIN users 
        ON users.id = clients.created_by
      LEFT JOIN paiement_tranches pt
        ON clients.id = pt.client_id AND pt.statut = 'En attente'
      WHERE clients.is_deleted = 0
    `;
    const params = [];
    const conditions = [];

    if (filters.month) {
      conditions.push(`DATE_FORMAT(clients.created_at, '%Y-%m') = ?`);
      params.push(filters.month);
    }

    if (filters.created_by) {
      conditions.push(`clients.created_by = ?`);
      params.push(filters.created_by);
    }

    if (filters.created_at_start) {
      conditions.push(`DATE(clients.created_at) >= ?`);
      params.push(filters.created_at_start);
    }

    if (filters.created_at_end) {
      conditions.push(`DATE(clients.created_at) <= ?`);
      params.push(filters.created_at_end);
    }

    if (conditions.length > 0) {
        query += ` AND ` + conditions.join(' AND ');
      }

    query += ` GROUP BY clients.id`;

    query += ` ORDER BY clients.created_at DESC, clients.id DESC`;

    const [rows] = await db.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query(`
      SELECT 
        clients.*,
        users.name AS creator_name,
        MIN(pt.date_echeance) AS prochaine_echeance
      FROM clients
      LEFT JOIN users 
        ON users.id = clients.created_by
      LEFT JOIN paiement_tranches pt
        ON clients.id = pt.client_id AND pt.statut = 'En attente'
      WHERE clients.id = ? AND clients.is_deleted = 0
      GROUP BY clients.id
    `, [id]);

    return rows[0];
  }

  static async create(data) {
    const toNum = (val) => (val === '' || val === undefined || val === null) ? null : parseFloat(val);
    const toDate = (val) => (val === '' || val === undefined || val === null) ? null : val;
    const toJson = (val) => (val === '' || val === undefined || val === null) ? null : (typeof val === 'string' ? val : JSON.stringify(val));

    const {
      police, societaire, adresse, tel, paiement, montant,
      reduction, rc, papier, usage_vehicle, immatriculation,
      date_effet, date_expiration, total, created_by,
      payment_status, payment_date, payment_method, category,
      montant_paye, date_prochain_paiement, created_at
      // nb_tranches, dates_tranches - excluded until database migration is executed
    } = data;

    const [result] = await db.query(
      `INSERT INTO clients (
        police, societaire, adresse, tel, paiement, montant, 
        reduction, rc, papier, usage_vehicle, immatriculation, 
        date_effet, date_expiration, total, created_by,
        payment_status, payment_date, payment_method, category,
        montant_paye, reste_a_payer, date_prochain_paiement, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
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
        toNum(total) - (toNum(montant_paye) || 0.00),
        toDate(date_prochain_paiement),
        toDate(created_at)
      ]
    );

    return result.insertId;
  }

  static async update(id, data) {
    const fields = [];
    const values = [];

    const numFields = ['montant', 'reduction', 'total', 'montant_paye', 'reste_a_payer'];
    const dateFields = ['date_effet', 'date_expiration', 'payment_date', 'date_prochain_paiement', 'created_at'];
    const jsonFields = []; // dates_tranches excluded until database migration is executed

    Object.keys(data).forEach(key => {
      // Skip nb_tranches and dates_tranches until database migration is executed
      if (key === 'nb_tranches' || key === 'dates_tranches') {
        return;
      }

      if (data[key] !== undefined) {
        let val = data[key];

        // Sanitize empty strings or nulls for specific types
        if (val === '') {
          if (numFields.includes(key)) {
            val = key === 'montant_paye' ? 0.00 : null;
          } else if (dateFields.includes(key)) {
            val = null;
          } else if (jsonFields.includes(key)) {
            val = null;
          }
        } else if (numFields.includes(key) && val !== null) {
          val = parseFloat(val);
        } else if (jsonFields.includes(key) && val !== null) {
          val = typeof val === 'string' ? val : JSON.stringify(val);
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
    const [result] = await db.query('UPDATE clients SET is_deleted = 1 WHERE id = ?', [id]);
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
         AND is_deleted = 0
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
         AND (renewal_status IS NULL OR renewal_status != 'Refused')
         AND is_deleted = 0`,
      [days]
    );
    return rows[0].count;
  }

  /**
   * Get all registered users (Admins or Employees) to populate the creator filter
   */
  static async getCreators() {
    const [rows] = await db.query(`
      SELECT id, name 
      FROM users 
      ORDER BY name ASC
    `);
    return rows;
  }

  /**
   * Find a client by exact matches on police or immatriculation
   * We exclude empty strings and nulls from being matched.
   */
  static async isExactDuplicate(data) {
    // List of fields to compare for exact duplicate detection (including date fields)
    // nb_tranches excluded until database migration is executed
    const fields = [
      'police', 'societaire', 'adresse', 'tel', 'paiement', 'montant',
      'reduction', 'rc', 'papier', 'usage_vehicle', 'immatriculation',
      'date_effet', 'date_expiration', 'total', 'renewal_status',
      'payment_status', 'payment_date', 'payment_method', 'category',
      'montant_paye', 'date_prochain_paiement'
    ];
    // Convert empty strings to null for proper MySQL DATE handling
    const params = fields.map(f => {
      const val = data[f];
      if (typeof val === 'string' && val.trim() === '') {
        return null;
      }
      return val ?? null;
    });
    // Build null‑safe equality conditions
    const conditions = fields.map(f => `${f} <=> ?`).join(' AND ');
    const query = `SELECT * FROM clients WHERE ${conditions} AND is_deleted = 0 LIMIT 1`;
    const [rows] = await db.query(query, params);
    return rows[0] || null;
  }

  static async findBySimilarities(police, immatriculation, tel) {
    const conditions = [];
    const params = [];

    if (police && police.trim() !== '') {
      conditions.push('clients.police = ?');
      params.push(police.trim());
    }

    if (immatriculation && immatriculation.trim() !== '') {
      conditions.push('clients.immatriculation = ?');
      params.push(immatriculation.trim());
    }
    
    // Commented out tel because it might yield too many false positives if multiple clients share the same phone
    // However, as requested by the bonus task, we add it to the check.
    if (tel && tel.trim() !== '') {
      conditions.push('clients.tel = ?');
      params.push(tel.trim());
    }

    if (conditions.length === 0) {
      return null;
    }

    const query = `
      SELECT 
        clients.*,
        users.name AS creator_name
      FROM clients
      LEFT JOIN users ON users.id = clients.created_by
      WHERE (${conditions.join(' OR ')}) AND clients.is_deleted = 0
      LIMIT 1
    `;

    const [rows] = await db.query(query, params);
    return rows[0];
  }
}

module.exports = Client;