const Company = require('../models/Company');
const CompanyCertification = require('../models/CompanyCertification');
const CompanyTraining = require('../models/CompanyTraining');

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const query = {};
    
    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Filter by origin country
    if (req.query.country) {
      query.originCountry = req.query.country;
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by field
    if (req.query.field) {
      query.fields = req.query.field;
    }
    
    // Filter by active status
    if (req.query.active) {
      query.isActive = req.query.active === 'true';
    }
    
    const companies = await Company.find(query)
      .populate('fields')
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies',
      error: error.message
    });
  }
};

// Get single company
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('fields');
      
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error.message
    });
  }
};

// Create new company
exports.createCompany = async (req, res) => {
  try {
    // Check if companyIdentifier is unique
    if (req.body.companyIdentifier) {
      const existingCompany = await Company.findOne({ 
        companyIdentifier: req.body.companyIdentifier 
      });
      
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company identifier already in use'
        });
      }
    }
    
    const company = await Company.create(req.body);
    
    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    // Check if updating companyIdentifier to a unique value
    if (req.body.companyIdentifier) {
      const existingCompany = await Company.findOne({ 
        companyIdentifier: req.body.companyIdentifier,
        _id: { $ne: req.params.id }
      });
      
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company identifier already in use'
        });
      }
    }
    
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('fields');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Delete associated certifications and trainings
    await CompanyCertification.deleteMany({ company: req.params.id });
    await CompanyTraining.deleteMany({ company: req.params.id });
    
    await company.remove();
    
    res.status(200).json({
      success: true,
      message: 'Company and all its associations deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
};

// Get company by identifier
exports.getCompanyByIdentifier = async (req, res) => {
  try {
    const company = await Company.findOne({ 
      companyIdentifier: req.params.identifier 
    }).populate('fields');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company',
      error: error.message
    });
  }
};

// Get distinct countries
exports.getCountries = async (req, res) => {
  try {
    const countries = await Company.distinct('originCountry');
    
    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch countries',
      error: error.message
    });
  }
};

// Get distinct company categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Company.distinct('category');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};