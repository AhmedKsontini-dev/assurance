const express = require('express');
const eventController = require('../controllers/eventController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(eventController.getAllEvents)
  .post(eventController.createEvent);

router.route('/:id')
  .put(eventController.updateEvent)
  .delete(eventController.deleteEvent);

module.exports = router;
