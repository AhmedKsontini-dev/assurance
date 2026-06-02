const Client = require('../models/clientModel');
const Renewal = require('../models/renewalModel');
const Versement = require('../models/versementModel');
const Note = require('../models/noteModel');
const logger = require('../utils/logger');

exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.getAll(req.query);
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
    console.log('[DEBUG] Données reçues pour la création du client (req.body):', req.body);

    const { police, immatriculation, tel } = req.body;
    const existingClient = await Client.findBySimilarities(police, immatriculation, tel);
    
    if (existingClient) {
      return res.status(409).json({
        status: 'fail',
        message: 'Un client similaire existe déjà.',
        existingClient: {
          id: existingClient.id,
          societaire: existingClient.societaire,
          tel: existingClient.tel,
          created_at: existingClient.created_at,
          creator_name: existingClient.creator_name,
          police: existingClient.police,
          immatriculation: existingClient.immatriculation
        }
      });
    }

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
    console.log(`[DEBUG] Données reçues pour la modification du client (ID: ${req.params.id}) (req.body):`, req.body);
    
    // Fetch old client to detect montant_paye increase
    const oldClient = await Client.getById(req.params.id);
    
    const updated = await Client.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found or no changes made'
      });
    }

    // Automatically create a versement if montant_paye increased during update
    if (oldClient && req.body.montant_paye !== undefined) {
      const newPaid = parseFloat(req.body.montant_paye) || 0;
      const oldPaid = parseFloat(oldClient.montant_paye) || 0;
      if (newPaid > oldPaid) {
        const diff = newPaid - oldPaid;
        await Versement.create({
          client_id: req.params.id,
          montant: diff,
          date_versement: new Date().toISOString().split('T')[0],
          methode_paiement: req.body.payment_method || 'Espece'
        });
      }
    }

    // Recalculate next payment date only if the user did NOT explicitly provide one.
    // If date_prochain_paiement is present in the body (even as ''), we respect the user's choice.
    if (req.body.date_prochain_paiement === undefined) {
      await recalculateNextPaymentDate(req.params.id);
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
      old_expiration_date,
      montant,
      reduction,
      total,
      paiement,
      payment_status,
      payment_date,
      montant_paye,
      date_prochain_paiement,
      versements
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

    // 2. If accepted, update the client's expiration date, status and payment details
    const updateData = { renewal_status: status };
    if (status === 'Accepted') {
      updateData.date_expiration = new_expiration_date;
      updateData.date_effet = old_expiration_date; // Le renouvellement commence à la date d'expiration précédente
      
      if (montant !== undefined) updateData.montant = montant;
      if (reduction !== undefined) updateData.reduction = reduction;
      if (total !== undefined) updateData.total = total;
      if (paiement !== undefined) updateData.paiement = paiement;
      if (payment_status !== undefined) updateData.payment_status = payment_status;
      if (payment_date !== undefined) updateData.payment_date = payment_date;
      if (montant_paye !== undefined) updateData.montant_paye = montant_paye;
      if (date_prochain_paiement !== undefined) {
        updateData.date_prochain_paiement = date_prochain_paiement;
      } else {
        updateData.date_prochain_paiement = null;
      }

      // 2b. Add multiple versements if provided
      if (versements && Array.isArray(versements)) {
        for (const v of versements) {
          if (v.montant && parseFloat(v.montant) > 0) {
            await Versement.create({
              client_id: id,
              montant: parseFloat(v.montant),
              date_versement: v.date_versement || new Date().toISOString().split('T')[0],
              methode_paiement: v.methode_paiement || paiement || 'Espece'
            });
          }
        }
      }

      // Recalculate next payment date
      await recalculateNextPaymentDate(id);
    } else {
      // If Refused or Follow-up, update the status
      // We could keep date_expiration and other values intact
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

exports.addClientVersement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { montant, date_versement, methode_paiement } = req.body;

    if (!montant || isNaN(montant) || parseFloat(montant) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Montant du versement invalide'
      });
    }

    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client non trouvé'
      });
    }

    // Create the versement record
    const versementId = await Versement.create({
      client_id: id,
      montant: parseFloat(montant),
      date_versement: date_versement || new Date().toISOString().split('T')[0],
      methode_paiement: methode_paiement || 'Espece'
    });

    // Calculate new montant_paye
    const currentPaid = parseFloat(client.montant_paye || 0);
    const newPaid = currentPaid + parseFloat(montant);
    const total = parseFloat(client.total || 0);

    let payment_status = 'Unpaid';
    if (newPaid >= total) {
      payment_status = 'Paid';
    } else if (newPaid > 0) {
      payment_status = 'Partial';
    }

    const updateData = {
      montant_paye: newPaid,
      payment_status,
      payment_date: payment_status === 'Paid' ? (date_versement || new Date().toISOString().split('T')[0]) : client.payment_date
    };

    await Client.update(id, updateData);

    // Recalculate next payment date
    await recalculateNextPaymentDate(id);

    // Log activity
    await logger.logActivity(
      req.user.id,
      'UPDATE',
      id,
      `Versement ajouté: ${montant} DT pour client ID: ${id}`
    );

    res.status(201).json({
      status: 'success',
      message: 'Versement enregistré avec succès',
      versementId
    });
  } catch (err) {
    next(err);
  }
};

exports.getClientVersements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const versements = await Versement.getByClientId(id);
    res.status(200).json({
      status: 'success',
      data: versements
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Recalculate and persist the next unpaid installment date for a client.
 * Logic:
 *   1. Fetch all versements sorted by date ASC.
 *   2. Walk through them cumulatively until the running total exceeds montant_paye.
 *   3. The versement where the threshold is crossed = next date to show.
 *   4. If fully paid → clear date_prochain_paiement.
 */
async function recalculateNextPaymentDate(clientId) {
  try {
    const client = await Client.getById(clientId);
    if (!client) return null;

    const total      = parseFloat(client.total       || 0);
    const montantPaye = parseFloat(client.montant_paye || 0);

    // Fully paid — no next date needed
    if (montantPaye >= total && total > 0) {
      await Client.update(clientId, { date_prochain_paiement: null });
      return null;
    }

    const versements = await Versement.getByClientId(clientId);
    if (!versements || versements.length === 0) {
      // No installments recorded — keep whatever date is already set
      return client.date_prochain_paiement;
    }

    // Sort ascending by installment date
    const sorted = [...versements].sort(
      (a, b) => new Date(a.date_versement) - new Date(b.date_versement)
    );

    let cumulative = 0;
    let nextDate   = null;

    for (const v of sorted) {
      cumulative += parseFloat(v.montant || 0);
      if (montantPaye < cumulative) {
        nextDate = v.date_versement;
        break;
      }
    }

    if (nextDate) {
      const formatted = new Date(nextDate).toISOString().split('T')[0];
      await Client.update(clientId, { date_prochain_paiement: formatted });
      return formatted;
    } else {
      await Client.update(clientId, { date_prochain_paiement: null });
      return null;
    }
  } catch (err) {
    console.error('[recalculateNextPaymentDate] Erreur:', err);
    return null;
  }
}

exports.checkDuplicate = async (req, res, next) => {
  try {
    const { police, immatriculation, tel } = req.query;
    const existingClient = await Client.findBySimilarities(police, immatriculation, tel);
    if (existingClient) {
      return res.status(200).json({
        status: 'success',
        isDuplicate: true,
        existingClient: {
          id: existingClient.id,
          societaire: existingClient.societaire,
          tel: existingClient.tel,
          created_at: existingClient.created_at,
          creator_name: existingClient.creator_name,
          police: existingClient.police,
          immatriculation: existingClient.immatriculation
        }
      });
    }
    
    res.status(200).json({
      status: 'success',
      isDuplicate: false
    });
  } catch (err) {
    next(err);
  }
};

exports.getCreators = async (req, res, next) => {
  try {
    const creators = await Client.getCreators();
    res.status(200).json({
      status: 'success',
      data: creators
    });
  } catch (err) {
    next(err);
  }
};

exports.getClientNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notes = await Note.getByClientId(id);
    res.status(200).json({
      status: 'success',
      data: notes
    });
  } catch (err) {
    next(err);
  }
};

exports.addClientNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Le contenu de la note est requis.'
      });
    }

    const noteId = await Note.create({
      client_id: id,
      user_id: req.user.id,
      content
    });

    await logger.logActivity(
      req.user.id,
      'UPDATE',
      id,
      `Note ajoutée pour le client ID: ${id}`
    );

    res.status(201).json({
      status: 'success',
      message: 'Note ajoutée avec succès.',
      noteId
    });
  } catch (err) {
    next(err);
  }
};
