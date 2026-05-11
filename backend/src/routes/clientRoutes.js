const express = require('express');
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// All client routes are protected
router.use(authMiddleware.protect);

router
  .route('/')
  .get(clientController.getAllClients)
  .post(authMiddleware.checkPermission('add'), clientController.createClient);

router
  .route('/:id')
  .get(clientController.getClientById)
  .put(authMiddleware.checkPermission('edit'), clientController.updateClient)
  .delete(authMiddleware.checkPermission('delete'), clientController.deleteClient);

module.exports = router;
