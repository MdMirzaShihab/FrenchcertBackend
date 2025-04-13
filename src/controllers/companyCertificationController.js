const CompanyCertification = require('../models/CompanyCertification');
const Company = require('../models/Company');
const Certification = require('../models/Certification');

// Get all company certifications
exports.getAllCompanyCertifications = async (req, res) => {
  try {
    const query = {};
    
    // Filter by company
    if (req.query.company) {
      query.company = req.query.company;
    }
    
    // Filter by certification
    if (req.query.certification) {
      query.certification = req.query.certification;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by expiry date range
    if (req.query.expiryStart && req.query.expiryEnd) {
      query.expiryDate = {
        $gte: new Date(req.query.expiryStart),
        $lte: new Date(req.query.expiryEnd)
      };
    } else if (req.query.expiryStart) {
      query.expiryDate = { $gte: new Date(req.query.expiryStart) };
    } else if (req.query.expiryEnd) {
      query.expiryDate = { $lte: new Date(req.query.expiryEnd) };
    }
    
    const companyCertifications = await CompanyCertification.find(query)
      .populate({
        path: 'company',
        select: 'name companyIdentifier'
      })
      .populate({
        path: 'certification',
        select: 'name certificationType'
      })
      .sort({ expiryDate: 1 });
      
    res.status(200).json({
      success: true,
      count: companyCertifications.length,
      data: companyCertifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company certifications',
      error: error.message
    });
  }
};

// Get all companies with a specific certification
exports.getCompaniesByCertification = async (req, res) => {
    try {
      const companyCertifications = await CompanyCertification.find({ certification: req.params.certificationId })
        .populate({
          path: 'company',
          select: 'name companyIdentifier category'
        })
        .sort({ expiryDate: 1 });
  
      res.status(200).json({
        success: true,
        count: companyCertifications.length,
        data: companyCertifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch companies with this certification',
        error: error.message
      });
    }
  };

// Get single company certification
exports.getCompanyCertification = async (req, res) => {
  try {
    const companyCertification = await CompanyCertification.findById(req.params.id)
      .populate('company')
      .populate('certification');
      
    if (!companyCertification) {
      return res.status(404).json({
        success: false,
        message: 'Company certification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: companyCertification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company certification',
      error: error.message
    });
  }
};

// Create new company certification
exports.createCompanyCertification = async (req, res) => {
  try {
    // Validate company exists
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Validate certification exists
    const certification = await Certification.findById(req.body.certification);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }
    
    const companyCertification = await CompanyCertification.create(req.body);
    
    res.status(201).json({
      success: true,
      data: companyCertification
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Certification ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create company certification',
      error: error.message
    });
  }
};

// Update company certification
exports.updateCompanyCertification = async (req, res) => {
  try {
    const companyCertification = await CompanyCertification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('company')
      .populate('certification');
    
    if (!companyCertification) {
      return res.status(404).json({
        success: false,
        message: 'Company certification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: companyCertification
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Certification ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update company certification',
      error: error.message
    });
  }
};

// Delete company certification
exports.deleteCompanyCertification = async (req, res) => {
  try {
    const companyCertification = await CompanyCertification.findById(req.params.id);
    
    if (!companyCertification) {
      return res.status(404).json({
        success: false,
        message: 'Company certification not found'
      });
    }
    
    await CompanyCertification.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Company certification deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company certification',
      error: error.message
    });
  }
};

// Verify certification by ID
exports.verifyCertification = async (req, res) => {
  try {
    const companyCertification = await CompanyCertification.findOne({
      certificationId: req.params.certificationId
    })
      .populate('company')
      .populate('certification');
    
    if (!companyCertification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }
    
    // Create verification response with limited data
    const verificationData = {
      certificationId: companyCertification.certificationId,
      company: {
        name: companyCertification.company.name,
        identifier: companyCertification.company.companyIdentifier
      },
      certification: {
        name: companyCertification.certification.name,
        type: companyCertification.certification.certificationType
      },
      issueDate: companyCertification.issueDate,
      expiryDate: companyCertification.expiryDate,
      status: companyCertification.status,
      isValid: companyCertification.status === 'active' && 
               new Date(companyCertification.expiryDate) > new Date()
    };
    
    res.status(200).json({
      success: true,
      data: verificationData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify certification',
      error: error.message
    });
  }
};

// Get company certifications dashboard stats
exports.getCertificationStats = async (req, res) => {
  try {
    const stats = {
      total: await CompanyCertification.countDocuments(),
      active: await CompanyCertification.countDocuments({ 
        status: 'active',
        expiryDate: { $gt: new Date() }
      }),
      expiring: await CompanyCertification.countDocuments({
        status: 'active',
        expiryDate: { 
          $gt: new Date(),
          $lt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 90 days
        }
      }),
      expired: await CompanyCertification.countDocuments({
        $or: [
          { status: 'expired' },
          { 
            status: 'active',
            expiryDate: { $lt: new Date() }
          }
        ]
      }),
      surveillanceDue: await CompanyCertification.countDocuments({
        status: 'active',
        $or: [
          {
            firstSurveillanceDate: { 
              $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          {
            secondSurveillanceDate: { 
              $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      })
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get certification statistics',
      error: error.message
    });
  }
};