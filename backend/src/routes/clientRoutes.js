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

router.get('/check-duplicate', authMiddleware.checkPermission('add'), clientController.checkDuplicate);
router.get('/creators', clientController.getCreators);

router
  .route('/:id')
  .get(clientController.getClientById)
  .put(authMiddleware.checkPermission('edit'), clientController.updateClient)
  .delete(authMiddleware.checkPermission('delete'), clientController.deleteClient);

router.post('/:id/renew', authMiddleware.checkPermission('edit'), clientController.renewClientSubscription);
router.get('/:id/renewals', clientController.getClientRenewals);
router.get('/renew-stats', authMiddleware.checkPermission('admin'), clientController.getRenewalStats);

// Client versements routes
router.post('/:id/versements', authMiddleware.checkPermission('edit'), clientController.addClientVersement);
router.get('/:id/versements', clientController.getClientVersements);

// Client notes routes
router.post('/:id/notes', clientController.addClientNote);
router.get('/:id/notes', clientController.getClientNotes);

// Client history routes
router.get('/:id/history', clientController.getClientHistory);

module.exports = router;
