const Note = require('../models/noteModel');

exports.getNotes = async (req, res, next) => {
  try {
    const notes = await Note.getByClientId(req.params.clientId);
    res.status(200).json({
      status: 'success',
      data: notes
    });
  } catch (err) {
    next(err);
  }
};

exports.addNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ status: 'fail', message: 'Le contenu de la note est requis.' });
    }

    const noteId = await Note.create({
      client_id: req.params.clientId,
      user_id: req.user.id,
      content
    });

    res.status(201).json({
      status: 'success',
      data: { id: noteId, client_id: req.params.clientId, user_id: req.user.id, content }
    });
  } catch (err) {
    next(err);
  }
};
