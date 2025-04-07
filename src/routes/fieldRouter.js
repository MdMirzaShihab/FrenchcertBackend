const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');

// Create a new field
router.post('/', fieldController.createField);

// Get all fields
router.get('/', fieldController.getAllFields);

// Get a single field by ID
router.get('/:id', fieldController.getField);

// Update a field by ID
router.put('/:id', fieldController.updateField);

// Delete a field by ID
router.delete('/:id', fieldController.deleteField);

module.exports = router;
