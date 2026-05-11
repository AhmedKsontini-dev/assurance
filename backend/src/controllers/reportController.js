const db = require('../config/db');

exports.getEmployeeReports = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email,
        COUNT(c.id) as total_clients,
        COALESCE(SUM(c.total), 0) as total_amount
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
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as sum FROM clients WHERE created_by = ?',
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

    // 2. Financial Summary
    const [todayStats] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM clients WHERE created_by = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    const [monthStats] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM clients WHERE created_by = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())',
      [userId]
    );
    const [weekStats] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM clients WHERE created_by = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)',
      [userId]
    );
    const [overallStats] = await db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM clients WHERE created_by = ?',
      [userId]
    );

    // Custom Date Stats
    let customDateStats = null;
    if (statsDate) {
      const [customRows] = await db.query(
        'SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as amount FROM clients WHERE created_by = ? AND DATE(created_at) = ?',
        [userId, statsDate]
      );
      customDateStats = customRows[0];
    }

    // 3. Clients List (Filtered by statsDate if provided)
    let clientQuery = 'SELECT * FROM clients WHERE created_by = ?';
    let clientParams = [userId];
    if (statsDate) {
      clientQuery += ' AND DATE(created_at) = ?';
      clientParams.push(statsDate);
    }
    clientQuery += ' ORDER BY created_at DESC';
    const [clients] = await db.query(clientQuery, clientParams);

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
          today: todayStats[0],
          week: weekStats[0],
          month: monthStats[0],
          overall: overallStats[0],
          custom: customDateStats
        },
        clients,
        logs
      }
    });
  } catch (err) {
    next(err);
  }
};
