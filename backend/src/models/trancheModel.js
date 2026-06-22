const db = require('../config/db');

class Tranche {
  static async create(data) {
    const { client_id, numero_tranche, date_echeance, montant_tranche } = data;
    const [result] = await db.query(
      `INSERT INTO paiement_tranches (
        client_id, numero_tranche, date_echeance, montant_tranche, statut
      ) VALUES (?, ?, ?, ?, 'En attente')`,
      [client_id, numero_tranche, date_echeance || null, parseFloat(montant_tranche) || 0]
    );
    return result.insertId;
  }

  static async getByClientId(clientId) {
    const [rows] = await db.query(
      `SELECT * FROM paiement_tranches WHERE client_id = ? ORDER BY numero_tranche ASC`,
      [clientId]
    );
    return rows;
  }

  static async getPendingAlerts(days = 7) {
    // Return pending tranches where date_echeance <= today + 7 days
    const [rows] = await db.query(
      `SELECT t.*, c.societaire, c.police, c.immatriculation, c.tel 
       FROM paiement_tranches t
       JOIN clients c ON t.client_id = c.id
       WHERE t.statut = 'En attente' 
         AND t.date_echeance IS NOT NULL
         AND t.date_echeance = (
             SELECT MIN(date_echeance)
             FROM paiement_tranches
             WHERE client_id = t.client_id AND statut = 'En attente' AND date_echeance IS NOT NULL
         )
         AND t.date_echeance <= CURDATE() + INTERVAL ? DAY
         AND c.is_deleted = 0
       GROUP BY t.client_id, t.id
       ORDER BY t.date_echeance ASC`,
      [days]
    );
    return rows;
  }

  static async markAsPaid(trancheId) {
    const [result] = await db.query(
      `UPDATE paiement_tranches 
       SET statut = 'Payée', date_paiement_reel = CURDATE() 
       WHERE id = ? AND statut = 'En attente'`,
      [trancheId]
    );
    return result.affectedRows > 0;
  }

  static async getById(trancheId) {
    const [rows] = await db.query(
      `SELECT * FROM paiement_tranches WHERE id = ?`,
      [trancheId]
    );
    return rows[0] || null;
  }

  static async deleteByClientId(clientId) {
    const [result] = await db.query(
      `DELETE FROM paiement_tranches WHERE client_id = ?`,
      [clientId]
    );
    return result.affectedRows;
  }
}

module.exports = Tranche;
