const Certification = require('../models/Certification');
const CompanyCertification = require('../models/CompanyCertification');


// Get all certifications
exports.getAllCertifications = async (req, res) => {
  try {
    const query = {};
    
    // Filter by certificationType if provided
    if (req.query.type) {
      query.certificationType = req.query.type;
    }
    
    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Field filter
    if (req.query.field) {
      query.fields = req.query.field;
    }
    
    const certifications = await Certification.find(query)
      .populate('fields')
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certifications',
      error: error.message
    });
  }
};

// Get single certification
exports.getCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id)
      .populate('fields');
      
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: certification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certification',
      error: error.message
    });
  }
};

// Create new certification
exports.createCertification = async (req, res) => {
  try {
    const certification = await Certification.create(req.body);
    
    res.status(201).json({
      success: true,
      data: certification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create certification',
      error: error.message
    });
  }
};

// Update certification
exports.updateCertification = async (req, res) => {
  try {
    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('fields');
    
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: certification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update certification',
      error: error.message
    });
  }
};

// Delete certification
exports.deleteCertification = async (req, res) => {
  try {
    const certification = await Certification.findById(req.params.id);
    
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: 'Certification not found'
      });
    }
    
    // Check if any companies have this certification
    const companyCount = await CompanyCertification.countDocuments({ 
      certification: req.params.id 
    });
    
    if (companyCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete certification as it is assigned to one or more companies',
        error: 'REFERENCE_ERROR'
      });
    }
    
    await certification.deleteOne(); // Using deleteOne() instead of remove()
    
    res.status(200).json({
      success: true,
      message: 'Certification deleted successfully'
    });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting certification',
      error: error.message
    });
  }
};

// Get certification types
exports.getCertificationTypes = async (req, res) => {
  try {
    // Distinct query to get unique certification types
    const types = await Certification.distinct('certificationType');
    
    res.status(200).json({
      success: true,
      count: types.length,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certification types',
      error: error.message
    });
  }
};