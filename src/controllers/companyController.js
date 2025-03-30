const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Company = require('../models/Company');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/secret');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Company login
exports.loginCompany = async (req, res) => {
  try {
    const { companyEmail, password } = req.body;

    // Find company by email
    const company = await Company.findOne({ companyEmail });
    if (!company) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(company._id);

    res.json({ token, company });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const company = new Company(req.body);
    await company.save();
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate('certificationList.service');
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
