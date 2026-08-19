const express = require('express');
const importController = require('../controllers/importController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Veuillez utiliser PDF, XLS ou XLSX.'));
    }
  }
});

const router = express.Router();

// All import routes are protected
router.use(authMiddleware.protect);

// Endpoint for analyzing file
router.post(
  '/analyze',
  authMiddleware.checkPermission('add'),
  upload.single('file'),
  importController.analyzeFile
);

// Endpoint for confirming and inserting validated clients
router.post(
  '/confirm',
  authMiddleware.checkPermission('add'),
  importController.confirmImport
);

module.exports = router;
