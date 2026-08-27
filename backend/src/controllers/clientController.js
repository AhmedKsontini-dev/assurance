const Client = require('../models/clientModel');
const Renewal = require('../models/renewalModel');
const Versement = require('../models/versementModel');
const Note = require('../models/noteModel');
const logger = require('../utils/logger');
const ClientHistory = require('../models/clientHistoryModel');
const Tranche = require('../models/trancheModel');
const db = require('../config/db');

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

    // Verify exact duplicate based on all fields
    const duplicateClient = await Client.isExactDuplicate(req.body);
    if (duplicateClient) {
      // Block creation – client already exists with identical data
      return res.status(409).json({
        status: 'fail',
        message: 'Ce client existe déjà dans la base de données.'
      });
    }

    const clientId = await Client.create({
      ...req.body,
      created_by: req.user.id
    });

    // Create initial versement if montant_paye > 0
    if (req.body.montant_paye && parseFloat(req.body.montant_paye) > 0) {
      let transactionDate = req.body.date_paiement || new Date().toISOString().split('T')[0];
      if (transactionDate.includes('T')) {
        transactionDate = transactionDate.split('T')[0];
      }

      await Versement.create({
        client_id: clientId,
        montant: parseFloat(req.body.montant_paye),
        date_versement: transactionDate,
        methode_paiement: req.body.payment_method || req.body.paiement || 'Espece',
        user_id: req.user.id
      });
    }

    // Save tranches if any
    if (req.body.tranches && Array.isArray(req.body.tranches) && req.body.tranches.length > 0) {
      for (let i = 0; i < req.body.tranches.length; i++) {
        const t = req.body.tranches[i];
        if (t.date_echeance) {
          await Tranche.create({
            client_id: clientId,
            numero_tranche: i + 1,
            date_echeance: t.date_echeance,
            montant_tranche: t.montant_tranche || 0
          });
        }
      }
    }

    // Log client creation to client history
    await ClientHistory.create({
      client_id: clientId,
      utilisateur_id: req.user.id,
      nom_utilisateur: req.user.name || 'Utilisateur',
      action_effectuee: 'Création du client',
      ancienne_valeur: null,
      nouvelle_valeur: req.body.societaire || 'Nouveau client'
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
    
    // Extract tranches to prevent SQL syntax errors and unknown column errors
    const tranchesData = req.body.tranches;
    delete req.body.tranches;
    delete req.body.dates_tranches;
    delete req.body.nb_tranches;

    // Fetch old client to detect montant_paye increase
    const oldClient = await Client.getById(req.params.id);
    
    // Handle new partial payment from frontend
    let montantVerseAujourdHui = req.body.montant_verse_aujourd_hui;
    delete req.body.montant_verse_aujourd_hui;

    let newPaymentAdded = false;
    let addedAmount = 0;
    let paymentDate = '';

    if (montantVerseAujourdHui !== undefined && parseFloat(montantVerseAujourdHui) > 0) {
      addedAmount = parseFloat(montantVerseAujourdHui);
      const currentPaid = parseFloat(oldClient.montant_paye) || 0;
      req.body.montant_paye = currentPaid + addedAmount;
      
      paymentDate = new Date().toISOString().split('T')[0];
      newPaymentAdded = true;

      await Versement.create({
        client_id: req.params.id,
        montant: addedAmount,
        date_versement: paymentDate,
        methode_paiement: req.body.payment_method || oldClient.paiement || 'Espece',
        user_id: req.user.id
      });
    }


    // Calculate reste_a_payer
    const total = req.body.total !== undefined ? (parseFloat(req.body.total) || 0) : (parseFloat(oldClient.total) || 0);
    const montantPaye = req.body.montant_paye !== undefined ? (parseFloat(req.body.montant_paye) || 0) : (parseFloat(oldClient.montant_paye) || 0);
    
    req.body.reste_a_payer = total - montantPaye;
    
    // Auto update status based on remains
    if (req.body.reste_a_payer <= 0 && total > 0) {
      req.body.payment_status = 'Paid';
    } else if (montantPaye > 0) {
      req.body.payment_status = 'Partial';
    }

    const updated = await Client.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found or no changes made'
      });
    }

    // Log history of changes
    if (oldClient) {
      const userName = req.user.name || 'Utilisateur';
      const userId = req.user.id;
      const clientId = req.params.id;
      const changes = [];

      if (req.body.payment_status !== undefined && req.body.payment_status !== oldClient.payment_status) {
        changes.push({
          action: 'Modification du statut de paiement',
          oldVal: oldClient.payment_status,
          newVal: req.body.payment_status
        });
      }

      if (req.body.montant_paye !== undefined && parseFloat(req.body.montant_paye) !== parseFloat(oldClient.montant_paye)) {
        changes.push({
          action: 'Modification du montant payé',
          oldVal: oldClient.montant_paye ? `${parseFloat(oldClient.montant_paye).toFixed(2)} DT` : '0.00 DT',
          newVal: `${parseFloat(req.body.montant_paye).toFixed(2)} DT`
        });
      }

      if (req.body.tel !== undefined && req.body.tel !== oldClient.tel) {
        changes.push({
          action: 'Modification du téléphone',
          oldVal: oldClient.tel || '-',
          newVal: req.body.tel || '-'
        });
      }

      if (req.body.adresse !== undefined && req.body.adresse !== oldClient.adresse) {
        changes.push({
          action: "Modification de l'adresse",
          oldVal: oldClient.adresse || '-',
          newVal: req.body.adresse || '-'
        });
      }

      for (const change of changes) {
        await ClientHistory.create({
          client_id: clientId,
          utilisateur_id: userId,
          nom_utilisateur: userName,
          action_effectuee: change.action,
          ancienne_valeur: change.oldVal,
          nouvelle_valeur: change.newVal
        });
      }

      if (newPaymentAdded) {
        const createDateStr = oldClient.created_at ? new Date(oldClient.created_at).toLocaleDateString('fr-FR') : '-';
        const paymentDateStr = new Date(paymentDate).toLocaleDateString('fr-FR');
        await ClientHistory.create({
          client_id: clientId,
          utilisateur_id: userId,
          nom_utilisateur: userName,
          action_effectuee: 'Ajout de paiement',
          ancienne_valeur: `Client enregistré le ${createDateStr}${oldClient.payment_status === 'Unpaid' ? ' comme impayé' : ''} pour ${oldClient.total || 0} DT.`,
          nouvelle_valeur: `Paiement de ${addedAmount.toFixed(2)} DT enregistré le ${paymentDateStr}. Montant ajouté à la caisse du ${paymentDateStr}.`
        });
      }
    }

    // Update tranches if provided
    if (tranchesData && Array.isArray(tranchesData)) {
      const existingTranches = await Tranche.getByClientId(req.params.id);
      
      for (let i = 0; i < tranchesData.length; i++) {
        const t = tranchesData[i];
        if (i < existingTranches.length) {
          // Update existing if it's 'En attente'
          if (existingTranches[i].statut === 'En attente') {
            await Tranche.update(existingTranches[i].id, {
              date_echeance: t.date_echeance,
              montant_tranche: t.montant_tranche
            });
          }
        } else {
          // Create new
          if (t.date_echeance) {
            await Tranche.create({
              client_id: req.params.id,
              numero_tranche: i + 1,
              date_echeance: t.date_echeance,
              montant_tranche: t.montant_tranche || 0
            });
          }
        }
      }
      
      // If there are more existing tranches than provided, delete the extra 'En attente' ones
      for (let i = tranchesData.length; i < existingTranches.length; i++) {
        if (existingTranches[i].statut === 'En attente') {
          await Tranche.delete(existingTranches[i].id);
        }
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
    const oldClient = await Client.getById(req.params.id);
    if (!oldClient) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found'
      });
    }

    // Log deletion history BEFORE deleting the client so the foreign key can resolve it and set to null later
    const userName = req.user.name || 'Utilisateur';
    await ClientHistory.create({
      client_id: req.params.id,
      utilisateur_id: req.user.id,
      nom_utilisateur: userName,
      action_effectuee: 'Suppression du client',
      ancienne_valeur: oldClient.societaire || `Client ID ${req.params.id}`,
      nouvelle_valeur: null
    });

    const deleted = await Client.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'Client not found'
      });
    }

    // Annuler tous les versements liés à ce client pour corriger la caisse
    await Versement.cancelByClientId(req.params.id);

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

    // Fetch old client to detect changes
    const oldClient = await Client.getById(id);

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
              methode_paiement: v.methode_paiement || paiement || 'Espece',
              user_id: req.user.id
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

    // Log history of modifications during renewal
    const userName = req.user.name || 'Utilisateur';
    if (oldClient) {
      if (updateData.payment_status !== undefined && updateData.payment_status !== oldClient.payment_status) {
        await ClientHistory.create({
          client_id: id,
          utilisateur_id: req.user.id,
          nom_utilisateur: userName,
          action_effectuee: 'Modification du statut de paiement',
          ancienne_valeur: oldClient.payment_status || 'Unpaid',
          nouvelle_valeur: updateData.payment_status
        });
      }

      if (updateData.montant_paye !== undefined && parseFloat(updateData.montant_paye) !== parseFloat(oldClient.montant_paye)) {
        await ClientHistory.create({
          client_id: id,
          utilisateur_id: req.user.id,
          nom_utilisateur: userName,
          action_effectuee: 'Modification du montant payé',
          ancienne_valeur: oldClient.montant_paye ? `${parseFloat(oldClient.montant_paye).toFixed(2)} DT` : '0.00 DT',
          nouvelle_valeur: `${parseFloat(updateData.montant_paye).toFixed(2)} DT`
        });
      }
    }

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
      methode_paiement: methode_paiement || 'Espece',
      user_id: req.user.id
    });

    // Calculate new montant_paye
    const currentPaid = parseFloat(client.montant_paye || 0);
    const newPaid = currentPaid + parseFloat(montant);
    const total = parseFloat(client.total || 0);
    const reste_a_payer = total - newPaid;

    let payment_status = 'Unpaid';
    if (newPaid >= total && total > 0) {
      payment_status = 'Paid';
    } else if (newPaid > 0) {
      payment_status = 'Partial';
    }

    const updateData = {
      montant_paye: newPaid,
      reste_a_payer: reste_a_payer,
      payment_status,
      payment_date: payment_status === 'Paid' ? (date_versement || new Date().toISOString().split('T')[0]) : client.payment_date
    };

    await Client.update(id, updateData);

    // Log history of modifications
    const userName = req.user.name || 'Utilisateur';
    await ClientHistory.create({
      client_id: id,
      utilisateur_id: req.user.id,
      nom_utilisateur: userName,
      action_effectuee: 'Modification du montant payé',
      ancienne_valeur: client.montant_paye ? `${parseFloat(client.montant_paye).toFixed(2)} DT` : '0.00 DT',
      nouvelle_valeur: `${parseFloat(newPaid).toFixed(2)} DT`
    });

    if (payment_status !== client.payment_status) {
      await ClientHistory.create({
        client_id: id,
        utilisateur_id: req.user.id,
        nom_utilisateur: userName,
        action_effectuee: 'Modification du statut de paiement',
        ancienne_valeur: client.payment_status || 'Unpaid',
        nouvelle_valeur: payment_status
      });
    }

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

exports.getClientHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await ClientHistory.getByClientId(id);
    res.status(200).json({
      status: 'success',
      data: history
    });
  } catch (err) {
    next(err);
  }
};

exports.getClientTranches = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tranches = await Tranche.getByClientId(id);
    res.status(200).json({
      status: 'success',
      data: tranches
    });
  } catch (err) {
    next(err);
  }
};

exports.payTranche = async (req, res, next) => {
  try {
    const { id: clientId, trancheId } = req.params;
    
    // Check if tranche exists and belongs to client
    const tranche = await Tranche.getById(trancheId);
    if (!tranche || tranche.client_id !== parseInt(clientId)) {
      return res.status(404).json({ status: 'fail', message: 'Tranche non trouvée' });
    }
    if (tranche.statut === 'Payée') {
      return res.status(400).json({ status: 'fail', message: 'Cette tranche est déjà payée' });
    }

    const client = await Client.getById(clientId);
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client non trouvé' });
    }

    // Mark as paid
    const success = await Tranche.markAsPaid(trancheId);
    if (!success) {
      return res.status(500).json({ status: 'fail', message: 'Erreur lors du paiement de la tranche' });
    }

    const amount = parseFloat(tranche.montant_tranche) || 0;
    const today = new Date().toISOString().split('T')[0];

    // Create a versement
    const versementId = await Versement.create({
      client_id: clientId,
      montant: amount,
      date_versement: today,
      methode_paiement: client.paiement || 'Espece',
      user_id: req.user.id
    });

    // Update client montant_paye and status
    const currentPaid = parseFloat(client.montant_paye || 0);
    const newPaid = currentPaid + amount;
    const total = parseFloat(client.total || 0);
    const reste_a_payer = total - newPaid;

    let payment_status = 'Unpaid';
    if (newPaid >= total && total > 0) {
      payment_status = 'Paid';
    } else if (newPaid > 0) {
      payment_status = 'Partial';
    }

    const updateData = {
      montant_paye: newPaid,
      reste_a_payer: reste_a_payer,
      payment_status,
      payment_date: payment_status === 'Paid' ? today : client.payment_date
    };

    await Client.update(clientId, updateData);

    // Log history
    const userName = req.user.name || 'Utilisateur';
    await ClientHistory.create({
      client_id: clientId,
      utilisateur_id: req.user.id,
      nom_utilisateur: userName,
      action_effectuee: 'Paiement de la tranche ' + tranche.numero_tranche,
      ancienne_valeur: 'En attente',
      nouvelle_valeur: 'Payée'
    });

    await ClientHistory.create({
      client_id: clientId,
      utilisateur_id: req.user.id,
      nom_utilisateur: userName,
      action_effectuee: 'Modification du montant payé',
      ancienne_valeur: currentPaid.toFixed(2) + ' DT',
      nouvelle_valeur: newPaid.toFixed(2) + ' DT'
    });

    if (payment_status !== client.payment_status) {
      await ClientHistory.create({
        client_id: clientId,
        utilisateur_id: req.user.id,
        nom_utilisateur: userName,
        action_effectuee: 'Modification du statut de paiement',
        ancienne_valeur: client.payment_status || 'Unpaid',
        nouvelle_valeur: payment_status
      });
    }

    await logger.logActivity(
      req.user.id,
      'UPDATE',
      clientId,
      `Tranche ${tranche.numero_tranche} payée (${amount} DT) pour le client ID: ${clientId}`
    );

    res.status(200).json({
      status: 'success',
      message: 'Tranche marquée comme payée et versement ajouté',
      versementId
    });

  } catch (err) {
    next(err);
  }
};

exports.updateClientVersement = async (req, res, next) => {
  try {
    const { id, versementId } = req.params;
    const { montant, date_versement } = req.body;

    const oldVersement = await Versement.getById(versementId);
    if (!oldVersement || oldVersement.client_id !== parseInt(id)) {
      return res.status(404).json({ status: 'fail', message: 'Versement non trouvé pour ce client' });
    }

    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client non trouvé' });
    }

    // Update Client's montant_paye if the amount changed
    const oldAmount = parseFloat(oldVersement.montant) || 0;
    const newAmount = parseFloat(montant) || 0;
    const diff = newAmount - oldAmount;

    if (diff !== 0) {
      const currentPaid = parseFloat(client.montant_paye) || 0;
      const newPaid = currentPaid + diff;
      const reste = (parseFloat(client.total) || 0) - newPaid;

      let payment_status = client.payment_status;
      if (reste <= 0 && parseFloat(client.total) > 0) {
        payment_status = 'Paid';
      } else if (newPaid > 0) {
        payment_status = 'Partial';
      } else {
        payment_status = 'Unpaid';
      }

      await Client.update(id, { montant_paye: newPaid, reste_a_payer: reste, payment_status });
    }

    // Update Versement
    await Versement.update(versementId, newAmount, date_versement);

    // Log History
    const changes = [];
    if (diff !== 0) {
      changes.push(`le montant de ${oldAmount.toFixed(2)} DT à ${newAmount.toFixed(2)} DT`);
    }
    const oldDateStr = new Date(oldVersement.date_versement).toLocaleDateString('fr-FR');
    const newDateStr = new Date(date_versement).toLocaleDateString('fr-FR');
    if (oldDateStr !== newDateStr) {
      changes.push(`la date du ${oldDateStr} au ${newDateStr}`);
    }

    if (changes.length > 0) {
      await ClientHistory.create({
        client_id: id,
        utilisateur_id: req.user.id,
        nom_utilisateur: req.user.name || 'Utilisateur',
        action_effectuee: 'Modification de paiement',
        ancienne_valeur: `Paiement ID ${versementId}`,
        nouvelle_valeur: `A modifié ${changes.join(' et ')}.`
      });
    }

    res.status(200).json({ status: 'success', message: 'Paiement mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
};

exports.deleteClientVersement = async (req, res, next) => {
  try {
    const { id, versementId } = req.params;

    const oldVersement = await Versement.getById(versementId);
    if (!oldVersement || oldVersement.client_id !== parseInt(id)) {
      return res.status(404).json({ status: 'fail', message: 'Versement non trouvé pour ce client' });
    }

    const client = await Client.getById(id);
    if (!client) {
      return res.status(404).json({ status: 'fail', message: 'Client non trouvé' });
    }

    // Update Client's montant_paye
    const amountToSubtract = parseFloat(oldVersement.montant) || 0;
    const currentPaid = parseFloat(client.montant_paye) || 0;
    const newPaid = currentPaid - amountToSubtract;
    const reste = (parseFloat(client.total) || 0) - newPaid;

    let payment_status = client.payment_status;
    if (reste <= 0 && parseFloat(client.total) > 0) {
      payment_status = 'Paid';
    } else if (newPaid > 0) {
      payment_status = 'Partial';
    } else {
      payment_status = 'Unpaid';
    }

    await Client.update(id, { montant_paye: newPaid, reste_a_payer: reste, payment_status });

    // Delete Versement
    await Versement.delete(versementId);

    // Log History
    await ClientHistory.create({
      client_id: id,
      utilisateur_id: req.user.id,
      nom_utilisateur: req.user.name || 'Utilisateur',
      action_effectuee: 'Suppression de paiement',
      ancienne_valeur: `Paiement de ${amountToSubtract.toFixed(2)} DT le ${new Date(oldVersement.date_versement).toLocaleDateString('fr-FR')}`,
      nouvelle_valeur: 'Paiement supprimé.'
    });

    res.status(200).json({ status: 'success', message: 'Paiement supprimé avec succès' });
  } catch (err) {
    next(err);
  }
};
