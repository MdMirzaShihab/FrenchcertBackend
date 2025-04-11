const express = require('express');
const router = express.Router();
const companyCertificationController = require('../controllers/companyCertificationController');

// @route   GET /api/company-certifications
// @desc    Get all company certifications (with optional filters)
router.get('/', companyCertificationController.getAllCompanyCertifications);

// @route   GET /api/company-certifications/:id
// @desc    Get a single company certification by ID
router.get('/:id', companyCertificationController.getCompanyCertification);

// @route   POST /api/company-certifications
// @desc    Create a new company certification
router.post('/', companyCertificationController.createCompanyCertification);

// @route   PUT /api/company-certifications/:id
// @desc    Update a company certification by ID
router.put('/:id', companyCertificationController.updateCompanyCertification);

// @route   DELETE /api/company-certifications/:id
// @desc    Delete a company certification by ID
router.delete('/:id', companyCertificationController.deleteCompanyCertification);

// @route   GET /api/company-certifications/verify/:certificationId
// @desc    Verify certification by its certification ID
router.get('/verify/:certificationId', companyCertificationController.verifyCertification);

// @route   GET /api/company-certifications/stats/dashboard
// @desc    Get certification dashboard statistics
router.get('/stats/dashboard', companyCertificationController.getCertificationStats);

module.exports = router;
