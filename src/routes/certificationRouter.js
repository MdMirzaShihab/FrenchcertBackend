const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');

// Create a new certification
router.post('/', certificationController.createCertification);

// Get all certifications (with optional filters)
router.get('/', certificationController.getAllCertifications);

// Get distinct certification types
router.get('/types/list', certificationController.getCertificationTypes);

// Get a single certification
router.get('/:id', certificationController.getCertification);

// Update certification
router.put('/:id', certificationController.updateCertification);

// Delete certification
router.delete('/:id', certificationController.deleteCertification);

module.exports = router;
