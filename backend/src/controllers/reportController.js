const db = require('../config/db');

exports.getEmployeeReports = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email,
        (SELECT COUNT(*) FROM clients c WHERE c.created_by = u.id AND c.is_deleted = 0) as total_clients,
        COALESCE((SELECT SUM(v.montant) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = u.id AND v.annule = 0 AND c.is_deleted = 0), 0) as total_amount
      FROM users u
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
      'SELECT * FROM clients WHERE created_by = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [userId]
    );

    // Get totals
    const [totalRows] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM clients WHERE created_by = ? AND is_deleted = 0) as count, 
        COALESCE((SELECT SUM(v.montant) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0), 0) as sum`,
      [userId, userId]
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
    const { statsDate, filterType } = req.query; // filterType: 'ajouts' or 'modifications'

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

    // 2. Financial Summary — caisse based on date_versement (actual payment date)
    // Today: payments actually received today
    const [todayClientStats] = await db.query(
      `SELECT COUNT(DISTINCT v.client_id) as count 
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND DATE(v.date_versement) = CURDATE() AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );
    const [todayAmountStats] = await db.query(
      `SELECT COALESCE(SUM(v.montant), 0) as amount,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) NOT LIKE '%ch_que%' AND LOWER(v.methode_paiement) NOT LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as espece,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as kembyela,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%ch_que%' THEN v.montant ELSE 0 END), 0) as cheque
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND DATE(v.date_versement) = CURDATE() AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );
    const todayCaisseNet = await getTodayCaisseNet();

    // Week: payments received this week
    const [weekClientStats] = await db.query(
      `SELECT COUNT(DISTINCT v.client_id) as count 
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND YEARWEEK(v.date_versement, 1) = YEARWEEK(CURDATE(), 1) AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );
    const [weekAmountStats] = await db.query(
      `SELECT COALESCE(SUM(v.montant), 0) as amount,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) NOT LIKE '%ch_que%' AND LOWER(v.methode_paiement) NOT LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as espece,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as kembyela,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%ch_que%' THEN v.montant ELSE 0 END), 0) as cheque
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND YEARWEEK(v.date_versement, 1) = YEARWEEK(CURDATE(), 1) AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );

    // Month: payments received this month
    const [monthClientStats] = await db.query(
      `SELECT COUNT(DISTINCT v.client_id) as count 
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND MONTH(v.date_versement) = MONTH(CURDATE()) AND YEAR(v.date_versement) = YEAR(CURDATE()) AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );
    const [monthAmountStats] = await db.query(
      `SELECT COALESCE(SUM(v.montant), 0) as amount,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) NOT LIKE '%ch_que%' AND LOWER(v.methode_paiement) NOT LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as espece,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as kembyela,
       COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%ch_que%' THEN v.montant ELSE 0 END), 0) as cheque
       FROM client_versements v JOIN clients c ON c.id = v.client_id
       WHERE v.user_id = ? AND MONTH(v.date_versement) = MONTH(CURDATE()) AND YEAR(v.date_versement) = YEAR(CURDATE()) AND v.annule = 0 AND c.is_deleted = 0`,
      [userId]
    );

    // Overall: clients who paid overall — NOT affected by caisse
    const [overallClientStats] = await db.query(
      `SELECT 
        (SELECT COUNT(DISTINCT v.client_id) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0) as count,
        COALESCE((SELECT SUM(v.montant) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0), 0) as amount,
        COALESCE((SELECT SUM(CASE WHEN LOWER(v.methode_paiement) NOT LIKE '%ch_que%' AND LOWER(v.methode_paiement) NOT LIKE '%kembyela%' THEN v.montant ELSE 0 END) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0), 0) as espece,
        COALESCE((SELECT SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%kembyela%' THEN v.montant ELSE 0 END) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0), 0) as kembyela,
        COALESCE((SELECT SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%ch_que%' THEN v.montant ELSE 0 END) FROM client_versements v JOIN clients c ON c.id = v.client_id WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0), 0) as cheque`,
      [userId, userId, userId, userId, userId]
    );

    // Custom Date Stats: payments received on a specific day + caisse net for that day
    let customDateStats = null;
    if (statsDate) {
      const [customRows] = await db.query(
        `SELECT COUNT(DISTINCT v.client_id) as count 
         FROM client_versements v JOIN clients c ON c.id = v.client_id
         WHERE v.user_id = ? AND DATE(v.date_versement) = ? AND v.annule = 0 AND c.is_deleted = 0`,
        [userId, statsDate]
      );
      const [customAmountStats] = await db.query(
        `SELECT COALESCE(SUM(v.montant), 0) as amount,
         COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) NOT LIKE '%ch_que%' AND LOWER(v.methode_paiement) NOT LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as espece,
         COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%kembyela%' THEN v.montant ELSE 0 END), 0) as kembyela,
         COALESCE(SUM(CASE WHEN LOWER(v.methode_paiement) LIKE '%ch_que%' THEN v.montant ELSE 0 END), 0) as cheque
         FROM client_versements v JOIN clients c ON c.id = v.client_id
         WHERE v.user_id = ? AND DATE(v.date_versement) = ? AND v.annule = 0 AND c.is_deleted = 0`,
        [userId, statsDate]
      );
      const customCaisseNet = await getCustomDayCaisseNet(statsDate);

      customDateStats = {
        count: customRows[0].count,
        amount: parseFloat(customAmountStats[0].amount) + customCaisseNet,
        espece: parseFloat(customAmountStats[0].espece) + customCaisseNet,
        kembyela: parseFloat(customAmountStats[0].kembyela),
        cheque: parseFloat(customAmountStats[0].cheque)
      };
    }

    // 3. Clients List (Filtered by statsDate and filterType if provided)
    const userRole = userRows[0].role;
    let clients = [];
    let modifications = [];

    if (filterType === 'modifications') {
      // Get clients modified by the employee (payments or other modifications)
      const modQuery = `
        SELECT DISTINCT 
          c.*,
          ch.action_effectuee,
          ch.ancienne_valeur,
          ch.nouvelle_valeur,
          ch.date_modification,
          ch.utilisateur_id,
          ch.nom_utilisateur,
          'history' as source_type
        FROM clients c
        INNER JOIN client_history ch ON c.id = ch.client_id
        WHERE ch.utilisateur_id = ? AND c.is_deleted = 0
        ${statsDate ? 'AND DATE(ch.date_modification) = ?' : 'AND DATE(ch.date_modification) = CURDATE()'}
        
        UNION ALL
        
        SELECT DISTINCT 
          c.*,
          'Paiement enregistré' as action_effectuee,
          v.montant as ancienne_valeur,
          v.montant as nouvelle_valeur,
          v.date_versement as date_modification,
          v.user_id as utilisateur_id,
          u.name as nom_utilisateur,
          'versement' as source_type
        FROM clients c
        INNER JOIN client_versements v ON c.id = v.client_id
        INNER JOIN users u ON v.user_id = u.id
        WHERE v.user_id = ? AND v.annule = 0 AND c.is_deleted = 0
        ${statsDate ? 'AND DATE(v.date_versement) = ?' : 'AND DATE(v.date_versement) = CURDATE()'}
        
        ORDER BY date_modification DESC
      `;
      
      const modParams = statsDate ? [userId, statsDate, userId, statsDate] : [userId, userId];
      const [modRows] = await db.query(modQuery, modParams);
      
      // Group modifications by client and get the most recent action
      modifications = modRows;
      
      // Get unique clients from modifications
      const uniqueClientIds = [...new Set(modifications.map(m => m.id))];
      if (uniqueClientIds.length > 0) {
        const [clientRows] = await db.query(
          `SELECT * FROM clients WHERE id IN (${uniqueClientIds.map(() => '?').join(',')}) AND is_deleted = 0`,
          uniqueClientIds
        );
        clients = clientRows;
      }
    } else {
      // Default: show clients created by the employee (Ajouts)
      let clientQuery = 'SELECT * FROM clients WHERE created_by = ? AND is_deleted = 0';
      let clientParams = [userId];
      
      if (statsDate) {
        clientQuery += ' AND DATE(created_at) = ?';
        clientParams.push(statsDate);
      } else {
        clientQuery += ' AND DATE(created_at) = CURDATE()';
      }
      clientQuery += ' ORDER BY created_at DESC';
      const [clientRows] = await db.query(clientQuery, clientParams);
      clients = clientRows;
    }

    // Fetch all clients for global alerts (like payment reminders)
    const [allClients] = await db.query('SELECT * FROM clients WHERE is_deleted = 0 ORDER BY created_at DESC');

    console.log('[DEBUG] User role:', userRole, 'User ID:', userId);
    console.log('[DEBUG] Filter type:', filterType);
    console.log('[DEBUG] Number of clients returned:', clients.length);
    console.log('[DEBUG] Number of modifications returned:', modifications.length);

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
          // "Aujourd'hui" = payments actually received today + caisse net of today
          today: {
            count: todayClientStats[0].count,
            amount: parseFloat(todayAmountStats[0].amount) + todayCaisseNet,
            espece: parseFloat(todayAmountStats[0].espece) + todayCaisseNet,
            kembyela: parseFloat(todayAmountStats[0].kembyela),
            cheque: parseFloat(todayAmountStats[0].cheque)
          },
          // "Cette semaine", "Ce mois", "Globale" = payments received in that period
          week: {
            count: weekClientStats[0].count,
            amount: parseFloat(weekAmountStats[0].amount),
            espece: parseFloat(weekAmountStats[0].espece),
            kembyela: parseFloat(weekAmountStats[0].kembyela),
            cheque: parseFloat(weekAmountStats[0].cheque)
          },
          month: {
            count: monthClientStats[0].count,
            amount: parseFloat(monthAmountStats[0].amount),
            espece: parseFloat(monthAmountStats[0].espece),
            kembyela: parseFloat(monthAmountStats[0].kembyela),
            cheque: parseFloat(monthAmountStats[0].cheque)
          },
          overall: {
            count: overallClientStats[0].count,
            amount: parseFloat(overallClientStats[0].amount),
            espece: parseFloat(overallClientStats[0].espece),
            kembyela: parseFloat(overallClientStats[0].kembyela),
            cheque: parseFloat(overallClientStats[0].cheque)
          },
          custom: customDateStats
        },
        clients,
        modifications,
        all_clients: allClients,
        logs
      }
    });
  } catch (err) {
    next(err);
  }
};