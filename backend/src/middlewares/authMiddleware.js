const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again!' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ status: 'fail', message: 'Your token has expired! Please log in again.' });
    }
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['ADMIN', 'EMPLOYEE']. role='EMPLOYEE'
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

exports.checkPermission = (permissionType) => {
  return (req, res, next) => {
    // Admins have bypass
    if (req.user.role === 'ADMIN') return next();

    let hasPermission = false;
    if (permissionType === 'add') hasPermission = req.user.can_add;
    if (permissionType === 'edit') hasPermission = req.user.can_edit;
    if (permissionType === 'delete') hasPermission = req.user.can_delete;

    if (!hasPermission) {
      return res.status(403).json({
        status: 'fail',
        message: `Accès refusé. Vous n'avez pas la permission de ${permissionType === 'add' ? 'créer' : permissionType === 'edit' ? 'modifier' : 'supprimer'} des données.`
      });
    }
    next();
  };
};
