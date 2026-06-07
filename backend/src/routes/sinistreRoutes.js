const express = require('express');
const router = express.Router();
const sinistreController = require('../controllers/sinistreController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sinistre-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers .png, .jpg, .jpeg et .pdf sont autorisés!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Routes
router.use(protect); // Require authentication for all sinistre routes

router.route('/')
  .get(sinistreController.getAllSinistres)
  .post(upload.single('rapport_cheque_file'), sinistreController.createSinistre);

router.route('/:id')
  .get(sinistreController.getSinistreById)
  .put(upload.single('rapport_cheque_file'), sinistreController.updateSinistre)
  .delete(sinistreController.deleteSinistre);

module.exports = router;
