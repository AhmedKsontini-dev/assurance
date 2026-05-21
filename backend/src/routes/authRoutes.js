const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.get('/profile', authController.getProfile);
router.post('/logout', authController.logout);
router.post('/heartbeat', authController.heartbeat);

// Only admin can register new users
router.post('/register', authMiddleware.restrictTo('ADMIN'), authController.register);

module.exports = router;
