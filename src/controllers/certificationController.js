const Certification = require("../models/Certification");
const CompanyCertification = require("../models/CompanyCertification");
const mongoose = require("mongoose");

// Helper function for case-insensitive search
const buildSearchQuery = (searchTerm) => {
  return {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { certificationType: { $regex: searchTerm, $options: 'i' } }
    ]
  };
};

// Get all certifications with pagination and search
exports.getAllCertifications = async (req, res) => {
  try {
    const { search, type, field, page = 1, limit = 10 } = req.query;
    const query = {};
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: "fields",
      sort: { name: 1 }
    };

    // Text search (searches name and certificationType fields)
    if (search) {
      Object.assign(query, buildSearchQuery(search));
    }

    // Filter by certificationType - EXACT MATCH
    if (type) {
      query.certificationType = type; 
    }

    // Field filter
    if (field) {
      try {
        query.fields = { 
          $in: [new mongoose.Types.ObjectId(field)] 
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid field ID format"
        });
      }
    }

    const result = await Certification.paginate(query, options);

    res.status(200).json({
      success: true,
      data: {
        certifications: result.docs,
        total: result.totalDocs,
        limit: result.limit,
        page: result.page,
        pages: result.totalPages
      }
    });
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch certifications",
      error: error.message,
    });
  }
};

// Get single certification
exports.getCertification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID format"
      });
    }

    const certification = await Certification.findById(req.params.id)
      .populate("fields");

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: certification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certification",
      error: error.message,
    });
  }
};

// Create new certification
exports.createCertification = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validate required fields
    const requiredFields = [
      "name",
      "shortDescription",
      "description",
      "certificationType",
      "callToAction",
      "fields",
      "durationInMonths"
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Trim and sanitize inputs
    const certificationData = {
      name: req.body.name.trim(),
      shortDescription: req.body.shortDescription.trim(),
      description: req.body.description, // Already sanitized by schema
      certificationType: req.body.certificationType.trim(),
      callToAction: req.body.callToAction.trim(),
      fields: req.body.fields,
      durationInMonths: req.body.durationInMonths
    };

    const certification = await Certification.create([certificationData], { session });

    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: certification[0],
    });
  } catch (error) {
    await session.abortTransaction();
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} must be unique`,
        error: 'DUPLICATE_KEY'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create certification',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Update certification
exports.updateCertification = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID format"
      });
    }

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.shortDescription) updateData.shortDescription = req.body.shortDescription.trim();
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.certificationType) updateData.certificationType = req.body.certificationType.trim();
    if (req.body.callToAction) updateData.callToAction = req.body.callToAction.trim();
    if (req.body.fields) {
      if (!Array.isArray(req.body.fields) || req.body.fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one field is required"
        });
      }
      updateData.fields = req.body.fields;
    }
    if (req.body.durationInMonths) updateData.durationInMonths = req.body.durationInMonths;

    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
        session
      }
    ).populate("fields");

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    await session.commitTransaction();
    
    res.status(200).json({
      success: true,
      data: certification,
    });
  } catch (error) {
    await session.abortTransaction();
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} must be unique`,
        error: 'DUPLICATE_KEY'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update certification',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Delete certification
exports.deleteCertification = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID format"
      });
    }

    // Check if certification exists
    const certification = await Certification.findById(req.params.id).session(session);
    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    // Check if any companies have this certification
    const companyCount = await CompanyCertification.countDocuments({
      certification: req.params.id
    }).session(session);

    if (companyCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete certification as it is assigned to one or more companies",
        error: "REFERENCE_ERROR",
      });
    }

    await Certification.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Delete certification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting certification",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Get certification types
exports.getCertificationTypes = async (req, res) => {
  try {
    const types = await Certification.distinct("certificationType");
    res.status(200).json({
      success: true,
      count: types.length,
      data: types,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certification types",
      error: error.message,
    });
  }
};

// Get public certifications
exports.getPublicCertifications = async (req, res) => {
  try {
    const { search, type, page = 1, limit = 10 } = req.query;
    const query = {};
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      select: "name shortDescription certificationType durationInMonths fields",
      populate: "fields",
      sort: { name: 1 }
    };

    // Text search (searches name and certificationType fields)
    if (search) {
      Object.assign(query, buildSearchQuery(search));
    }

    // Filter by certificationType - EXACT MATCH
    if (type) {
      query.certificationType = type; // Exact match instead of regex
    }

    const result = await Certification.paginate(query, options);

    res.status(200).json({
      success: true,
      data: {
        certifications: result.docs,
        total: result.totalDocs,
        limit: result.limit,
        page: result.page,
        pages: result.totalPages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch public certifications",
      error: error.message,
    });
  }
};

// Get public certification details
exports.getPublicCertificationDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certification ID format"
      });
    }

    const certification = await Certification.findById(req.params.id)
      .select("name description certificationType callToAction durationInMonths fields")
      .populate("fields");

    if (!certification) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    res.status(200).json({
      success: true,
      data: certification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certification details",
      error: error.message,
    });
  }
};