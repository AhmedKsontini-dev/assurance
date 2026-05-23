const Client = require('../models/clientModel');

/**
 * Get all clients with expiring policies (within N days).
 * Default threshold: 10 days.
 * Also returns clients already expired (negative days remaining).
 */
exports.getExpiringClients = async (req, res, next) => {
  try {
    const threshold = parseInt(req.query.days) || 10;
    const clients = await Client.getExpiring(threshold);

    // Enrich each client with computed alert metadata
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts = clients.map(client => {
      const expDate = new Date(client.date_expiration);
      expDate.setHours(0, 0, 0, 0);
      const diffTime = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let level = 'orange'; // default: less than 10 days
      if (daysRemaining <= 3) level = 'red';    // very close
      if (daysRemaining <= 0) level = 'expired'; // already expired

      return {
        ...client,
        days_remaining: daysRemaining,
        alert_level: level
      };
    });

    // Sort by days remaining (most urgent first)
    alerts.sort((a, b) => a.days_remaining - b.days_remaining);

    res.status(200).json({
      status: 'success',
      total_alerts: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get alert count only (for navbar badge).
 */
exports.getAlertCount = async (req, res, next) => {
  try {
    const count = await Client.getExpiringCount(10);
    res.status(200).json({
      status: 'success',
      count
    });
  } catch (err) {
    next(err);
  }
};