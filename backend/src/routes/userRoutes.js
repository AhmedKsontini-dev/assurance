const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protect all routes - Only ADMIN can manage users
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('ADMIN'));

router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
