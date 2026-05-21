const express = require('express');
const expenseController = require('../controllers/expenseController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { verifyExpenseOwnership } = require('../middlewares/ownershipMiddleware');

const router = express.Router();

// All routes are protected and restricted to ADMIN
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.get('/stats', expenseController.getExpenseStats);
router.get('/upcoming', expenseController.getUpcomingExpenses);

router.use('/:id', verifyExpenseOwnership);
router.route('/:id')
  .put(expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

module.exports = router;
