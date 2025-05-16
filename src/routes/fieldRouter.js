const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const fieldPendingActionController = require('../controllers/fieldPendingActionController');
const { authenticate, csrfProtection, authorize } = require('../middlewares/auth');
const { validateFieldRequest } = require('../validators/field');

// Public routes - no authentication required
// Get all fields
router.get('/', fieldController.getAllFields);

// Get a single field by ID
router.get('/:id', fieldController.getField);

// Protected routes - authentication required
router.use(authenticate, csrfProtection);

// Get field pending and performed actions for the current user
router.get('/status/user', fieldPendingActionController.getUserFieldPendingActions);

// Request to create a new field (creates a pending action)
router.post('/pending/create', validateFieldRequest, fieldPendingActionController.requestCreateField);

// Request to update a field (creates a pending action)
router.put('/pending/update/:id', validateFieldRequest, fieldPendingActionController.requestUpdateField);

// Request to delete a field (creates a pending action)
router.delete('/pending/delete/:id', fieldPendingActionController.requestDeleteField);



// Admin-only routes for direct field operations
// Only admins can bypass the pending action system
router.use(authorize(['admin']));

// Direct CRUD operations - admin only
router.post('/admin', fieldController.createField);
router.put('/admin/:id', fieldController.updateField);
router.delete('/admin/:id', fieldController.deleteField);

module.exports = router;