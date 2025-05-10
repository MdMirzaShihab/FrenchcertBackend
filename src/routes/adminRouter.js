const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize, csrfProtection } = require('../middlewares/auth');

// All routes require authentication, admin role, and CSRF protection
router.use(authenticate, authorize(['admin']), csrfProtection);

// Pending actions routes
router.get('/pending-actions', adminController.getPendingActions);
router.get('/pending-actions/:actionId', adminController.getPendingActionById);
router.put('/pending-actions/:actionId/:decision', adminController.processPendingAction);

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId', adminController.updateUser);

module.exports = router;