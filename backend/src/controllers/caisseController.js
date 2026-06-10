const Caisse = require('../models/caisseModel');
const { logActivity } = require('../utils/logger');

/**
 * Get aggregated summary
 * GET /api/caisse/summary
 */
exports.getDailySummary = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const targetUserId = req.query.userId;

    // If userId is provided, check if current user is admin
    if (targetUserId) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          status: 'fail',
          message: 'Seuls les administrateurs peuvent consulter le journal de caisse d\'autres employés.'
        });
      }
    }

    const userId = targetUserId || req.user.id;
    const summary = await Caisse.getDailySummary(userId, date);

    res.status(200).json({
      status: 'success',
      data: { summary }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all entries
 * GET /api/caisse/entries
 */
exports.getEntries = async (req, res, next) => {
  try {
    const { limit, date, userId: targetUserId } = req.query;

    // If userId is provided, check if current user is admin
    if (targetUserId) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          status: 'fail',
          message: 'Seuls les administrateurs peuvent consulter le journal de caisse d\'autres employés.'
        });
      }
    }

    const userId = targetUserId || req.user.id;
    const entries = await Caisse.getEntries(userId, parseInt(limit) || 50, date);

    res.status(200).json({
      status: 'success',
      results: entries.length,
      data: { entries }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add a new entry (INCOME or EXPENSE)
 * POST /api/caisse/entries
 */
exports.addEntry = async (req, res, next) => {
  try {
    const { montant, type, description, date_operation } = req.body;

    if (!montant || !type || !description || !date_operation) {
      return res.status(400).json({
        status: 'fail',
        message: 'Montant, type, description et date sont requis.'
      });
    }

    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Type invalide. Doit être INCOME ou EXPENSE.'
      });
    }

    const entry = await Caisse.addEntry(req.user.id, {
      montant: parseFloat(montant),
      type,
      description,
      date_operation
    });

    // LOG ACTIVITY
    const label = type === 'INCOME' ? 'Total Entrées (+)' : 'Total Sorties (-)';
    await logActivity(
      req.user.id, 
      'ADD', 
      null, 
      `Ajout ${label}: ${montant} TND - ${description}`
    );

    // Get updated summary to return to frontend
    const summary = await Caisse.getDailySummary(req.user.id, date_operation);

    res.status(201).json({
      status: 'success',
      data: { entry, summary }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete an entry
 * DELETE /api/caisse/entries/:id
 */
exports.deleteEntry = async (req, res, next) => {
  try {
    // We need the entry details for the log before deleting
    // But since our model doesn't have a getEntryById, we'll just log the ID or add a generic log
    // For better logs, I'll assume we want to know what was deleted.
    
    const deleted = await Caisse.deleteEntry(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Entrée non trouvée.'
      });
    }

    // LOG ACTIVITY
    await logActivity(
      req.user.id, 
      'DELETE', 
      null, 
      `Suppression d'un mouvement de caisse (ID: ${req.params.id})`
    );

    // Get updated summary to return
    const summary = await Caisse.getDailySummary(req.user.id, new Date().toISOString().split('T')[0]);

    res.status(200).json({
      status: 'success',
      message: 'Entrée supprimée avec succès.',
      data: { summary }
    });
  } catch (err) {
    next(err);
  }
};
