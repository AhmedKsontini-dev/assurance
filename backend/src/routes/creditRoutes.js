const express = require('express');
const creditController = require('../controllers/creditController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', creditController.getCredits);

module.exports = router;
