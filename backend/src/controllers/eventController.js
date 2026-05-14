const db = require('../config/db');

/**
 * Get all events for the authenticated user
 * GET /api/events
 */
exports.getAllEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      'SELECT * FROM events WHERE user_id = ? ORDER BY event_date ASC, start_time ASC',
      [req.user.id]
    );

    res.status(200).json({
      status: 'success',
      results: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new event
 * POST /api/events
 */
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, event_date, start_time, end_time, color, amount } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Titre et date sont requis.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO events (user_id, title, description, event_date, start_time, end_time, color, amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, event_date, start_time || null, end_time || null, color || '#3b82f6', amount || 0]
    );

    const [newEvent] = await db.query('SELECT * FROM events WHERE id = ?', [result.insertId]);

    res.status(201).json({
      status: 'success',
      data: newEvent[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an event
 * PUT /api/events/:id
 */
exports.updateEvent = async (req, res, next) => {
  try {
    const { title, description, event_date, start_time, end_time, color, amount } = req.body;

    const [result] = await db.query(
      `UPDATE events SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, color = ?, amount = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, event_date, start_time || null, end_time || null, color || '#3b82f6', amount || 0, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Événement non trouvé ou non autorisé.'
      });
    }

    const [updatedEvent] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);

    res.status(200).json({
      status: 'success',
      data: updatedEvent[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an event
 * DELETE /api/events/:id
 */
exports.deleteEvent = async (req, res, next) => {
  try {
    const [result] = await db.query(
      'DELETE FROM events WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Événement non trouvé ou non autorisé.'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
