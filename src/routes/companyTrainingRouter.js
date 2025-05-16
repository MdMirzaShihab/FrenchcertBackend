const express = require('express');
const router = express.Router();
const companyTrainingController = require('../controllers/companyTrainingController');

// @route   GET /api/company-trainings
// @desc    Get all company trainings (with optional filters)
router.get('/', companyTrainingController.getAllCompanyTrainings);

// @route   GET /api/company-trainings/:id
// @desc    Get a single company training by ID
router.get('/:id', companyTrainingController.getCompanyTraining);

// @route   POST /api/company-trainings
// @desc    Create a new company training
router.post('/', companyTrainingController.createCompanyTraining);

// @route   PUT /api/company-trainings/:id
// @desc    Update a company training by ID
router.put('/:id', companyTrainingController.updateCompanyTraining);

// @route   GET /api/company-trainings/training/:trainingId
// @desc    Get all companies with a specific training
router.get('/training/:trainingId', companyTrainingController.getCompaniesByTraining);

// @route   DELETE /api/company-trainings/:id
// @desc    Delete a company training by ID
router.delete('/:id', companyTrainingController.deleteCompanyTraining);

// @route   GET /api/company-trainings/verify/:trainingId
// @desc    Verify training by its training ID
router.get('/verify/:trainingId', companyTrainingController.verifyTraining);

// @route   GET /api/company-trainings/stats/dashboard
// @desc    Get training dashboard statistics
router.get('/stats/dashboard', companyTrainingController.getTrainingStats);

module.exports = router;