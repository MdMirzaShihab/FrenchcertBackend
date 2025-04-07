const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');

// Create a new training
router.post('/', trainingController.createTraining);

// Get all trainings (with optional filters)
router.get('/', trainingController.getAllTrainings);

// Get all training types
router.get('/types/list', trainingController.getTrainingTypes);

// Get all training methods
router.get('/methods/list', trainingController.getTrainingMethods);

// Get a single training
router.get('/:id', trainingController.getTraining);

// Update a training
router.put('/:id', trainingController.updateTraining);

// Delete a training
router.delete('/:id', trainingController.deleteTraining);

module.exports = router;
