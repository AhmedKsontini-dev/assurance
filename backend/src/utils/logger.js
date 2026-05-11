const db = require('../config/db');

exports.logActivity = async (userId, actionType, clientId = null, description = '') => {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, action_type, client_id, description) VALUES (?, ?, ?, ?)',
      [userId, actionType, clientId, description]
    );
  } catch (err) {
    console.error('Logging Error:', err);
  }
};

exports.startSession = async (userId) => {
  try {
    const [result] = await db.query(
      'INSERT INTO sessions (user_id, login_time) VALUES (?, NOW())',
      [userId]
    );
    return result.insertId;
  } catch (err) {
    console.error('Session Start Error:', err);
  }
};

exports.endSession = async (sessionId) => {
  try {
    await db.query(
      `UPDATE sessions SET 
        logout_time = NOW(), 
        duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW()) 
      WHERE id = ?`,
      [sessionId]
    );
  } catch (err) {
    console.error('Session End Error:', err);
  }
};
