const db = require('../config/db');

exports.getCredits = async (req, res, next) => {
  try {
    const { status, search, date } = req.query;

    // Build the query
    let query = `
      SELECT c.*, u.name as creator_name
      FROM clients c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.is_deleted = 0 AND c.is_credit = 1
    `;
    const params = [];

    if (status) {
      if (status === 'Impayé') {
        query += ' AND c.reste_a_payer = c.total AND c.total > 0';
      } else if (status === 'Partiellement payé') {
        query += ' AND c.reste_a_payer < c.total AND c.reste_a_payer > 0';
      } else if (status === 'Soldé') {
        query += ' AND c.reste_a_payer <= 0';
      }
    }

    if (search) {
      query += ' AND (c.societaire LIKE ? OR c.police LIKE ? OR c.tel LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (date) {
      query += ' AND DATE(c.created_at) = ?';
      params.push(date);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await db.query(query, params);

    // Calculate totals over ALL credits (ignoring search filters)
    const [statsRows] = await db.query(`
      SELECT 
        SUM(c.reste_a_payer) as total_restant,
        SUM(CASE WHEN c.reste_a_payer = c.total AND c.total > 0 THEN 1 ELSE 0 END) as impayes_count,
        SUM(CASE WHEN c.reste_a_payer < c.total AND c.reste_a_payer > 0 THEN 1 ELSE 0 END) as partiels_count
      FROM clients c
      WHERE c.is_deleted = 0 AND c.is_credit = 1 AND c.reste_a_payer > 0
    `);

    res.status(200).json({
      status: 'success',
      data: {
        credits: rows,
        stats: {
          total_restant: statsRows[0].total_restant || 0,
          impayes_count: statsRows[0].impayes_count || 0,
          partiels_count: statsRows[0].partiels_count || 0
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
