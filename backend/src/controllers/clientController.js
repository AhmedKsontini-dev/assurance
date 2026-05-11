const Client = require('../models/clientModel');
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
      `Added client: ${req.body.societaire || 'Unknown'}`
    );

    res.status(201).json({
      status: 'success',
      message: 'Client created successfully',
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
      `Updated client: ${req.body.societaire || 'ID ' + req.params.id}`
    );

    res.status(200).json({
      status: 'success',
      message: 'Client updated successfully'
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
      `Deleted client ID: ${req.params.id}`
    );

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
