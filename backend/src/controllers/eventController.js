const db = require('../config/db');

/**
 * Get all events for the authenticated user
 * GET /api/events
 */
exports.getAllEvents = async (req, res, next) => {
  try {
    const [events] = await db.query(
      `SELECT e.*, u.name as creator_name 
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.event_partage = true OR e.user_id = ? 
       ORDER BY e.event_date ASC, e.start_time ASC`,
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
    const { title, description, event_date, start_time, end_time, color, amount, event_partage } = req.body;

    if (!title || !event_date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Titre et date sont requis.'
      });
    }

    const [result] = await db.query(
      `INSERT INTO events (user_id, title, description, event_date, start_time, end_time, color, amount, event_partage) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, event_date, start_time || null, end_time || null, color || '#3b82f6', amount || 0, event_partage || false]
    );

    const [newEvent] = await db.query(
      `SELECT e.*, u.name as creator_name 
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = ?`, 
      [result.insertId]
    );

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
    const { title, description, event_date, start_time, end_time, color, amount, event_partage } = req.body;

    const [result] = await db.query(
      `UPDATE events SET title = ?, description = ?, event_date = ?, start_time = ?, end_time = ?, color = ?, amount = ?, event_partage = ?
       WHERE id = ? AND user_id = ?`,
      [title, description, event_date, start_time || null, end_time || null, color || '#3b82f6', amount || 0, event_partage || false, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Événement non trouvé ou non autorisé.'
      });
    }

    const [updatedEvent] = await db.query(
      `SELECT e.*, u.name as creator_name 
       FROM events e 
       JOIN users u ON e.user_id = u.id 
       WHERE e.id = ?`, 
      [req.params.id]
    );

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
