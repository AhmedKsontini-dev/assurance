const express = require('express');
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All alert routes are protected
router.use(authMiddleware.protect);

router.get('/', alertController.getExpiringClients);
router.get('/count', alertController.getAlertCount);
router.get('/payments', alertController.getPaymentAlerts);

module.exports = router;
