const db = require('../config/db');

class Client {
  static async getAll() {
    const [rows] = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
    return rows;
  }

  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    return rows[0];
  }

  static async create(data) {
    const {
      police, societaire, adresse, tel, paiement, montant,
      reduction, rc, papier, usage_vehicle, immatriculation,
      date_effet, date_expiration, total, created_by
    } = data;

    const [result] = await db.query(
      `INSERT INTO clients (
        police, societaire, adresse, tel, paiement, montant, 
        reduction, rc, papier, usage_vehicle, immatriculation, 
        date_effet, date_expiration, total, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        police, societaire, adresse, tel, paiement, montant,
        reduction, rc, papier, usage_vehicle, immatriculation,
        date_effet, date_expiration, total, created_by
      ]
    );

    return result.insertId;
  }

  static async update(id, data) {
    const {
      police, societaire, adresse, tel, paiement, montant,
      reduction, rc, papier, usage_vehicle, immatriculation,
      date_effet, date_expiration, total
    } = data;

    const [result] = await db.query(
      `UPDATE clients SET 
        police = ?, societaire = ?, adresse = ?, tel = ?, paiement = ?, 
        montant = ?, reduction = ?, rc = ?, papier = ?, usage_vehicle = ?, 
        immatriculation = ?, date_effet = ?, date_expiration = ?, total = ?
      WHERE id = ?`,
      [
        police, societaire, adresse, tel, paiement, montant,
        reduction, rc, papier, usage_vehicle, immatriculation,
        date_effet, date_expiration, total, id
      ]
    );

    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await db.query('DELETE FROM clients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Client;
