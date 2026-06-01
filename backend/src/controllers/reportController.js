const db = require('../config/db');

exports.getEmployeeReports = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email,
        COUNT(c.id) as total_clients,
        COALESCE(SUM(c.montant_paye), 0) as total_amount
      FROM users u
      LEFT JOIN clients c ON u.id = c.created_by
      GROUP BY u.id, u.name, u.email
    `;
    const [rows] = await db.query(query);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Get employee info
    const [userRows] = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Employee not found'
      });
    }

    // Get client list
    const [clientRows] = await db.query(
      'SELECT * FROM clients WHERE created_by = ? ORDER BY created_at DESC',
      [userId]
    );

    // Get totals
    const [totalRows] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(montant_paye), 0) as sum FROM clients WHERE created_by = ?',
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        employee: userRows[0],
        clients: clientRows,
        stats: totalRows[0]
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeAnalytics = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { statsDate } = req.query;

    // 1. Employee Info
    const [userRows] = await db.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (userRows.length === 0) return res.status(404).json({ status: 'fail', message: 'Employee not found' });

    // Helper to get net caisse balance for a specific day only
    // Only used for the "Aujourd'hui" card — other cards are NOT affected by caisse
    const getTodayCaisseNet = async () => {
      const query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN montant ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN montant ELSE 0 END), 0) as net
        FROM caisse_entries 
        WHERE user_id = ? AND DATE(date_operation) = CURDATE()
      `;
      const [rows] = await db.query(query, [userId]);
      return parseFloat(rows[0].net || 0);
    };

    // Helper to get caisse net for a custom date (used in custom date card only)
    const getCustomDayCaisseNet = async (date) => {
      const query = `
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'INCOME' THEN montant ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN montant ELSE 0 END), 0) as net
        FROM caisse_entries 
        WHERE user_id = ? AND DATE(date_operation) = ?
      `;
      const [rows] = await db.query(query, [userId, date]);
      return parseFloat(rows[0].net || 0);
    };

    // 2. Financial Summary
    // Today: client contracts created today + caisse net of today (ONLY card affected by caisse)
    const [todayClientStats] = await db.query(
      'SELECT COUNT(*) as count FROM clients WHERE created_by = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    const [todayAmountStats] = await db.query(
      `SELECT 
        (
          SELECT COALESCE(SUM(v.montant), 0) 
          FROM client_versements v 
          JOIN clients c ON v.client_id = c.id 
          WHERE c.created_by = ? AND DATE(v.date_versement) = CURDATE()
        )
        +
        (
          SELECT COALESCE(SUM(GREATEST(0, c.montant_paye - COALESCE((SELECT SUM(montant) FROM client_versements WHERE client_id = c.id), 0))), 0)
          FROM clients c
          WHERE c.created_by = ? AND DATE(c.created_at) = CURDATE()
        )
       AS amount`,
      [userId, userId]
    );
    const todayCaisseNet = await getTodayCaisseNet();

    // Week: client contracts only — NOT affected by caisse
    const [weekClientStats] = await db.query(
      'SELECT COUNT(*) as count FROM clients WHERE created_by = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)',
      [userId]
    );
    const [weekAmountStats] = await db.query(
      `SELECT 
        (
          SELECT COALESCE(SUM(v.montant), 0) 
          FROM client_versements v 
          JOIN clients c ON v.client_id = c.id 
          WHERE c.created_by = ? AND YEARWEEK(v.date_versement, 1) = YEARWEEK(CURDATE(), 1)
        )
        +
        (
          SELECT COALESCE(SUM(GREATEST(0, c.montant_paye - COALESCE((SELECT SUM(montant) FROM client_versements WHERE client_id = c.id), 0))), 0)
          FROM clients c
          WHERE c.created_by = ? AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)
        )
       AS amount`,
      [userId, userId]
    );

    // Month: client contracts only — NOT affected by caisse
    const [monthClientStats] = await db.query(
      'SELECT COUNT(*) as count FROM clients WHERE created_by = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())',
      [userId]
    );
    const [monthAmountStats] = await db.query(
      `SELECT 
        (
          SELECT COALESCE(SUM(v.montant), 0) 
          FROM client_versements v 
          JOIN clients c ON v.client_id = c.id 
          WHERE c.created_by = ? AND MONTH(v.date_versement) = MONTH(CURDATE()) AND YEAR(v.date_versement) = YEAR(CURDATE())
        )
        +
        (
          SELECT COALESCE(SUM(GREATEST(0, c.montant_paye - COALESCE((SELECT SUM(montant) FROM client_versements WHERE client_id = c.id), 0))), 0)
          FROM clients c
          WHERE c.created_by = ? AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())
        )
       AS amount`,
      [userId, userId]
    );

    // Overall: client contracts only — NOT affected by caisse
    const [overallClientStats] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(montant_paye), 0) as amount FROM clients WHERE created_by = ?',
      [userId]
    );

    // Custom Date Stats: includes caisse net for that specific day
    let customDateStats = null;
    if (statsDate) {
      const [customRows] = await db.query(
        'SELECT COUNT(*) as count FROM clients WHERE created_by = ? AND DATE(created_at) = ?',
        [userId, statsDate]
      );
      const [customAmountStats] = await db.query(
        `SELECT 
          (
            SELECT COALESCE(SUM(v.montant), 0) 
            FROM client_versements v 
            JOIN clients c ON v.client_id = c.id 
            WHERE c.created_by = ? AND DATE(v.date_versement) = ?
          )
          +
          (
            SELECT COALESCE(SUM(GREATEST(0, c.montant_paye - COALESCE((SELECT SUM(montant) FROM client_versements WHERE client_id = c.id), 0))), 0)
            FROM clients c
            WHERE c.created_by = ? AND DATE(c.created_at) = ?
          )
         AS amount`,
        [userId, statsDate, userId, statsDate]
      );
      const customCaisseNet = await getCustomDayCaisseNet(statsDate);

      customDateStats = {
        count: customRows[0].count,
        amount: parseFloat(customAmountStats[0].amount) + customCaisseNet
      };
    }

    // 3. Clients List (Filtered by statsDate if provided)
    // Show only own clients for all roles (including ADMIN)
    const userRole = userRows[0].role;
    let clientQuery = 'SELECT * FROM clients WHERE created_by = ?';
    let clientParams = [userId];
    
    if (statsDate) {
      clientQuery += ' AND DATE(created_at) = ?';
      clientParams.push(statsDate);
    }
    clientQuery += ' ORDER BY created_at DESC';
    const [clients] = await db.query(clientQuery, clientParams);

    // Fetch all clients for global alerts (like payment reminders)
    const [allClients] = await db.query('SELECT * FROM clients ORDER BY created_at DESC');

    console.log('[DEBUG] User role:', userRole, 'User ID:', userId);
    console.log('[DEBUG] Client query:', clientQuery);
    console.log('[DEBUG] Number of own clients returned:', clients.length);

    // 4. Activity Logs (Filtered by statsDate if provided)
    let logQuery = 'SELECT * FROM activity_logs WHERE user_id = ?';
    let logParams = [userId];
    if (statsDate) {
      logQuery += ' AND DATE(created_at) = ?';
      logParams.push(statsDate);
    }
    logQuery += ' ORDER BY created_at DESC LIMIT 100';
    const [logs] = await db.query(logQuery, logParams);

    res.status(200).json({
      status: 'success',
      data: {
        employee: userRows[0],
        financials: {
          // "Aujourd'hui" = client contracts of the day + caisse net of the day
          today: {
            count: todayClientStats[0].count,
            amount: parseFloat(todayAmountStats[0].amount) + todayCaisseNet
          },
          // "Cette semaine", "Ce mois", "Globale" = client contracts only, caisse-independent
          week: {
            count: weekClientStats[0].count,
            amount: parseFloat(weekAmountStats[0].amount)
          },
          month: {
            count: monthClientStats[0].count,
            amount: parseFloat(monthAmountStats[0].amount)
          },
          overall: {
            count: overallClientStats[0].count,
            amount: parseFloat(overallClientStats[0].amount)
          },
          custom: customDateStats
        },
        clients,
        all_clients: allClients,
        logs
      }
    });
  } catch (err) {
    next(err);
  }
};
