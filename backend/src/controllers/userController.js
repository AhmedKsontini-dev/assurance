const User = require('../models/userModel');

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (err) {
    next(err);
  }
};

const bcrypt = require('bcryptjs');

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, can_add, can_edit, can_delete } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = await User.create({ 
      name, 
      email, 
      password: hashedPassword, 
      role,
      can_add: can_add !== undefined ? can_add : true,
      can_edit: can_edit !== undefined ? can_edit : true,
      can_delete: can_delete !== undefined ? can_delete : true
    });
    
    res.status(201).json({
      status: 'success',
      data: { id: userId, name, email, role, can_add, can_edit, can_delete }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, password, can_add, can_edit, can_delete } = req.body;
    const updateData = { name, email, role, can_add, can_edit, can_delete };
    
    await User.update(req.params.id, updateData);
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await User.updatePassword(req.params.id, hashedPassword);
    }

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};
