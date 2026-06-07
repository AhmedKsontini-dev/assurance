const Sinistre = require('../models/sinistreModel');
const path = require('path');
const fs = require('fs');

exports.getAllSinistres = async (req, res) => {
  try {
    const sinistres = await Sinistre.findAll();
    res.json(sinistres);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving sinistres', error: err.message });
  }
};

exports.getSinistreById = async (req, res) => {
  try {
    const sinistre = await Sinistre.findById(req.params.id);
    if (!sinistre) {
      return res.status(404).json({ message: 'Sinistre non trouvé' });
    }
    res.json(sinistre);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving sinistre', error: err.message });
  }
};

exports.createSinistre = async (req, res) => {
  try {
    const sinistreData = { ...req.body };
    
    if (req.file) {
      sinistreData.rapport_cheque = req.file.filename;
    }

    const newId = await Sinistre.create(sinistreData);
    res.status(201).json({ message: 'Sinistre ajouté avec succès', id: newId });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de l\'ajout', error: err.message });
  }
};

exports.updateSinistre = async (req, res) => {
  try {
    const sinistreData = { ...req.body };

    if (req.file) {
      sinistreData.rapport_cheque = req.file.filename;

      // Optional: Delete old file
      const oldSinistre = await Sinistre.findById(req.params.id);
      if (oldSinistre && oldSinistre.rapport_cheque) {
        const oldPath = path.join(__dirname, '../../uploads/', oldSinistre.rapport_cheque);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }

    const updated = await Sinistre.update(req.params.id, sinistreData);
    if (!updated) {
      return res.status(404).json({ message: 'Sinistre non trouvé' });
    }
    res.json({ message: 'Sinistre modifié avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la modification', error: err.message });
  }
};

exports.deleteSinistre = async (req, res) => {
  try {
    const oldSinistre = await Sinistre.findById(req.params.id);
    if (oldSinistre && oldSinistre.rapport_cheque) {
      const oldPath = path.join(__dirname, '../../uploads/', oldSinistre.rapport_cheque);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const deleted = await Sinistre.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Sinistre non trouvé' });
    }
    res.json({ message: 'Sinistre supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: err.message });
  }
};
