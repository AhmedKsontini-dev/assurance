const express = require('express');
const noteController = require('../controllers/noteController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Important for /clients/:clientId/notes

router.use(protect);

router.get('/', noteController.getNotes);
router.post('/', noteController.addNote);

module.exports = router;
