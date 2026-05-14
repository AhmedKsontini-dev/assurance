const Category = require('../models/categoryModel');

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.getAll();
    res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Category name is required' });
    }
    const id = await Category.create(name);
    res.status(201).json({
      status: 'success',
      data: { id, name }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ status: 'error', message: 'Category already exists' });
    }
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.delete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
