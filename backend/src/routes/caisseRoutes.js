const express = require('express');
const caisseController = require('../controllers/caisseController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// Summary
router.get('/summary', caisseController.getDailySummary);

// Entries CRUD
router.get('/entries', caisseController.getEntries);
router.post('/entries', caisseController.addEntry);
router.delete('/entries/:id', caisseController.deleteEntry);

module.exports = router;
