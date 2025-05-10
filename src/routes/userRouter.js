const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, csrfProtection } = require('../middlewares/auth');
const { validatePendingAction } = require('../validators/pendingAction');

// All routes require authentication and CSRF protection
router.use(authenticate, csrfProtection);

// Pending actions routes
router.post('/pending-actions', validatePendingAction, userController.createPendingAction);
router.get('/pending-actions', userController.getUserPendingActions);
router.get('/pending-actions/:actionId', userController.getUserPendingActionById);
router.delete('/pending-actions/:actionId', userController.cancelPendingAction);

module.exports = router;