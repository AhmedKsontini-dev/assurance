const Expense = require('../models/expenseModel');

exports.getExpenses = async (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      date: req.query.date,
      search: req.query.search
    };
    
    const expenses = await Expense.findByUserId(req.user.id, filters);
    
    res.status(200).json({
      status: 'success',
      results: expenses.length,
      data: { expenses }
    });
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const expenseData = {
      ...req.body,
      user_id: req.user.id
    };
    
    const id = await Expense.create(expenseData);
    const newExpense = await Expense.findById(id);
    
    res.status(201).json({
      status: 'success',
      data: { expense: newExpense }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    await Expense.update(req.params.id, req.body);
    const updatedExpense = await Expense.findById(req.params.id);
    
    res.status(200).json({
      status: 'success',
      data: { expense: updatedExpense }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    await Expense.delete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getExpenseStats = async (req, res, next) => {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      date: req.query.date
    };
    const stats = await Expense.getStatsByUserId(req.user.id, filters);
    
    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/expenses/upcoming
 * Returns expenses with expense_date between today and today+3 days
 * Used for Dashboard reminder banner
 */
exports.getUpcomingExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.getUpcomingExpenses(req.user.id);
    res.status(200).json({
      status: 'success',
      results: expenses.length,
      data: { expenses }
    });
  } catch (err) {
    next(err);
  }
};
