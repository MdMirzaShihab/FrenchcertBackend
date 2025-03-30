const express = require('express');
const { loginCompany } = require('../controllers/companyController');

const router = express.Router();

router.post('/login', loginCompany);

module.exports = router;
