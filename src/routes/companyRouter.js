const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Create a new company
router.post('/', companyController.createCompany);

// Get all companies (with filters)
router.get('/', companyController.getAllCompanies);

// Get distinct origin countries
router.get('/countries/list', companyController.getCountries);

// Get distinct company categories
router.get('/categories/list', companyController.getCategories);

// Get a single company by MongoDB ID
router.get('/:id', companyController.getCompany);

// Get a company by its identifier
router.get('/identifier/:identifier', companyController.getCompanyByIdentifier);

// Update a company
router.put('/:id', companyController.updateCompany);

// Delete a company and its associated records
router.delete('/:id', companyController.deleteCompany);

module.exports = router;
