const express = require('express');
const router = express.Router();
const certificationController = require('../controllers/certificationController');


// Get all certifications for dropdown
router.get('/dropdown', certificationController.getAllCertificationsForDropdown);

// Get distinct certification types
router.get('/types/list', certificationController.getCertificationTypes);

// Get all certifications for public
router.get('/public/list', certificationController.getPublicCertifications);

// Create a new certification
router.post('/', certificationController.createCertification);

// Get all certifications (with optional filters)
router.get('/', certificationController.getAllCertifications);

// Get a single certification
router.get('/:id', certificationController.getCertification);

// Update certification
router.put('/:id', certificationController.updateCertification);

// Delete certification
router.delete('/:id', certificationController.deleteCertification);

// Get public distinct certification details
router.get('/public/:id', certificationController.getPublicCertificationDetails);

module.exports = router;
