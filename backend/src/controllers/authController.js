const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: { userId }
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // 3) Log activity and session
    await logger.logActivity(user.id, 'LOGIN', null, `User logged in from ${req.ip}`);
    const sessionId = await logger.startSession(user.id);

    // 4) If everything ok, send token to client
    const token = signToken(user.id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      sessionId,
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await logger.endSession(sessionId);
    }
    await logger.logActivity(req.user.id, 'LOGOUT', null, `User logged out`);
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware
    res.status(200).json({
      status: 'success',
      data: { user: req.user }
    });
  } catch (err) {
    next(err);
  }
};

exports.heartbeat = async (req, res, next) => {
  try {
    const db = require('../config/db');
    await db.query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.user.id]);
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};
