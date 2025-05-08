const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize(['admin']));

router.get('/pending-actions', adminController.getPendingActions);
router.put('/pending-actions/:actionId/:decision', adminController.processPendingAction);

module.exports = router;