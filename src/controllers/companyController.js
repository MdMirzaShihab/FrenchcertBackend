const mongoose = require('mongoose');
const Company = require("../models/Company");
const CompanyCertification = require("../models/CompanyCertification");
const CompanyTraining = require("../models/CompanyTraining");

// Get all companies
exports.getAllCompanies = async (req, res) => {
  try {
    const query = {};

    // Text search
    if (req.query.search) {
      // Using $text requires proper text indexes
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

    // Filter by field - ensure this is an ObjectId when filtering
    if (req.query.field) {
      if (!mongoose.Types.ObjectId.isValid(req.query.field)) {
        return res.status(400).json({
          success: false,
          message: "Invalid field ID format"
        });
      }
      query.fields = { $in: [new mongoose.Types.ObjectId(req.query.field)] };
    }
    // Filter by employee count range
    if (req.query.minEmployees) {
      query.employeeCount = {
        ...query.employeeCount,
        $gte: parseInt(req.query.minEmployees),
      };
    }
    if (req.query.maxEmployees) {
      query.employeeCount = {
        ...query.employeeCount,
        $lte: parseInt(req.query.maxEmployees),
      };
    }

    // Validate pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters (page must be ≥1, limit between 1-100)"
      });
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[req.query.sort || 'name'] = req.query.order === 'desc' ? -1 : 1;

    const [companies, total] = await Promise.all([
      Company.find(query)
        .populate("fields")
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Company.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: companies.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: companies,
    });

  } catch (error) {
    console.error("Error fetching companies:", error);
    
    // Specific error handling
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format in query",
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while fetching companies",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single company
exports.getCompany = async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }

    const company = await Company.findById(req.params.id).populate("fields");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch company",
      error: error.message,
    });
  }
};

// Create new company
exports.createCompany = async (req, res) => {
  try {
    // Basic validation
    const requiredFields = [
      "name",
      "originCountry",
      "category",
      "employeeCount",
      "email",
      "phone",
    ];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create company",
      error: error.errors || error.message,
    });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("fields");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update company",
      error: error.message,
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
        message: "Company not found",
      });
    }

    // Delete associated certifications and trainings
    await CompanyCertification.deleteMany({ company: req.params.id });
    await CompanyTraining.deleteMany({ company: req.params.id });

    // Use deleteOne instead of remove
    await Company.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: "Company and all its associations deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete company",
      error: error.message,
    });
  }
};




// Get distinct countries
exports.getCountries = async (req, res) => {
  try {
    const countries = await Company.distinct("originCountry");

    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch countries",
      error: error.message,
    });
  }
};

// Get distinct company categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Company.distinct("category");

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};
