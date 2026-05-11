const Expense = require('../models/expenseModel');

exports.verifyExpenseOwnership = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        status: 'fail',
        message: 'Expense not found'
      });
    }

    // Check if the expense belongs to the logged-in user
    if (expense.user_id !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to access this expense'
      });
    }

    // Attach expense to request for further use
    req.expense = expense;
    next();
  } catch (err) {
    next(err);
  }
};
