const express = require('express');
const { createCompany, getCompanies, updateCompany, deleteCompany } = require('../controllers/companyController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, adminOnly, createCompany);
router.get('/', protect, adminOnly, getCompanies);
router.put('/:id', protect, adminOnly, updateCompany);
router.delete('/:id', protect, adminOnly, deleteCompany);

module.exports = router;
