const express = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(categoryController.createCategory);

router.delete('/:id', authMiddleware.checkPermission('admin'), categoryController.deleteCategory);

module.exports = router;
