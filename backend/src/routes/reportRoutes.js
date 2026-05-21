const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Custom middleware to allow admin OR self
const allowAdminOrSelf = (req, res, next) => {
  if (req.user.role === 'ADMIN' || Number(req.user.id) === Number(req.params.id)) {
    return next();
  }
  return res.status(403).json({ status: 'fail', message: 'Unauthorized access' });
};

router.get('/employees', authMiddleware.restrictTo('ADMIN'), reportController.getEmployeeReports);
router.get('/employee/:id', allowAdminOrSelf, reportController.getEmployeeDetails);
router.get('/employee/:id/details', allowAdminOrSelf, reportController.getEmployeeAnalytics);

module.exports = router;
