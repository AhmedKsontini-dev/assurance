const Client = require('../models/clientModel');
const Renewal = require('../models/renewalModel');
const logger = require('../utils/logger');

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.getAll();
    res.status(200).json({
      status: 'success',
      results: clients.length,
      data: clients
    });
  } catch (err) {
    next(err);
  }
};

exports.getClientById = async (req, res, next) => {
  try {
    const client = await Client.getById(req.params.id);
    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: client
    });
  } catch (err) {
    next(err);
  }
};

exports.createClient = async (req, res, next) => {
  try {
    const clientId = await Client.create({
      ...req.body,
      created_by: req.user.id
    });

    await logger.logActivity(
      req.user.id, 
      'ADD', 
      clientId, 
      `Ajout client: ${req.body.societaire || 'Unknown'}`
    );

    res.status(201).json({
      status: 'success',
      message: 'Client crée avec succès',
      clientId
    });
  } catch (err) {
    next(err);
  }
};

exports.updateClient = async (req, res, next) => {
  try {
    const updated = await Client.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found or no changes made'
      });
    }

    await logger.logActivity(
      req.user.id, 
      'UPDATE', 
      req.params.id, 
      `Modification client: ${req.body.societaire || 'ID ' + req.params.id}`
    );

    res.status(200).json({
      status: 'success',
      message: 'Client mis à jour avec succès'
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteClient = async (req, res, next) => {
  try {
    const deleted = await Client.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found'
      });
    }

    await logger.logActivity(
      req.user.id, 
      'DELETE', 
      req.params.id, 
      `Suppression client ID: ${req.params.id}`
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.renewClientSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      new_expiration_date, 
      plan_duration, 
      notes, 
      status,
      old_expiration_date 
    } = req.body;

    // 1. Create renewal history record
    const renewalId = await Renewal.create({
      client_id: id,
      old_expiration_date,
      new_expiration_date,
      admin_id: req.user.id,
      plan_duration,
      notes,
      status
    });

    // 2. If accepted or refused, update the client's expiration date or status
    const updateData = { renewal_status: status };
    if (status === 'Accepted') {
      updateData.date_expiration = new_expiration_date;
    }
    await Client.update(id, updateData);

    // 3. Log activity
    await logger.logActivity(
      req.user.id,
      'RENEW',
      id,
      `Renouvellement client ID: ${id} (${status})`
    );

    res.status(200).json({
      status: 'success',
      message: 'Renouvellement enregistré avec succès',
      renewalId
    });
  } catch (err) {
    next(err);
  }
};

exports.getClientRenewals = async (req, res, next) => {
  try {
    const renewals = await Renewal.getByClientId(req.params.id);
    res.status(200).json({
      status: 'success',
      data: renewals
    });
  } catch (err) {
    next(err);
  }
};

exports.getRenewalStats = async (req, res, next) => {
  try {
    const stats = await Renewal.getStats();
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
