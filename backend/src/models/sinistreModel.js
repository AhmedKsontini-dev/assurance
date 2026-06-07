const pool = require('../config/db');

const Sinistre = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM sinistres ORDER BY created_at DESC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM sinistres WHERE id = ?', [id]);
    return rows[0];
  },

  create: async (sinistreData) => {
    const {
      numero_police, nom_client, immatriculation, date_accident,
      numero_sinistre, nom_expert, nature_sinistre, montant_rapport_expertise,
      observation, rapport_cheque, date_cheque
    } = sinistreData;

    const [result] = await pool.query(
      `INSERT INTO sinistres (
        numero_police, nom_client, immatriculation, date_accident,
        numero_sinistre, nom_expert, nature_sinistre, montant_rapport_expertise,
        observation, rapport_cheque, date_cheque
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero_police || null, nom_client || null, immatriculation || null, date_accident || null,
        numero_sinistre || null, nom_expert || null, nature_sinistre || null, montant_rapport_expertise || null,
        observation || null, rapport_cheque || null, date_cheque || null
      ]
    );
    return result.insertId;
  },

  update: async (id, sinistreData) => {
    const {
      numero_police, nom_client, immatriculation, date_accident,
      numero_sinistre, nom_expert, nature_sinistre, montant_rapport_expertise,
      observation, rapport_cheque, date_cheque
    } = sinistreData;

    // Check if rapport_cheque is provided. If not, don't update it to avoid overwriting existing file
    let query = `
      UPDATE sinistres SET
        numero_police = ?, nom_client = ?, immatriculation = ?, date_accident = ?,
        numero_sinistre = ?, nom_expert = ?, nature_sinistre = ?, montant_rapport_expertise = ?,
        observation = ?, date_cheque = ?
    `;
    const values = [
      numero_police || null, nom_client || null, immatriculation || null, date_accident || null,
      numero_sinistre || null, nom_expert || null, nature_sinistre || null, montant_rapport_expertise || null,
      observation || null, date_cheque || null
    ];

    if (rapport_cheque !== undefined) {
      query += `, rapport_cheque = ?`;
      values.push(rapport_cheque);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    const [result] = await pool.query(query, values);
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM sinistres WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Sinistre;
