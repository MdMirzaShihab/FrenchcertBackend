const express = require('express');
const router = express.Router();
const companyTrainingController = require('../controllers/companyTrainingController');

// Routes



// @route   GET /api/company-trainings
// @desc    Get all company trainings (with optional filters)
router.get('/', companyTrainingController.getAllCompanyTrainings);

// @route   GET /api/company-trainings/stats/dashboard
// @desc    Get training dashboard statistics
router.get('/stats/dashboard', companyTrainingController.getCompanyTrainingStats);

// @route   GET /api/company-trainings/verify/:trainingId
// @desc    Verify training by its training ID
router.get('/verify/:trainingId', companyTrainingController.verifyTraining);

// @route   GET /api/company-trainings/:id
// @desc    Get a single company training by ID
router.get('/:id', companyTrainingController.getCompanyTraining);

// @route   POST /api/company-trainings
// @desc    Create a new company training
router.post('/', companyTrainingController.createCompanyTraining);

// @route   PUT /api/company-trainings/:id
// @desc    Update a company training by ID
router.put('/:id', companyTrainingController.updateCompanyTraining);


// @route   DELETE /api/company-trainings/:id
// @desc    Delete a company training by ID
router.delete('/:id', companyTrainingController.deleteCompanyTraining);

module.exports = router;
