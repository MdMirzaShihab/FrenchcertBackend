const Certification = require("../models/Certification");
const CompanyCertification = require("../models/CompanyCertification");

// Get all certifications
exports.getAllCertifications = async (req, res) => {
  try {
    const query = {};

    // Text search (searches both name and certificationType)
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by certificationType if provided
    if (req.query.type) {
      query.certificationType = { $regex: new RegExp(req.query.type, 'i') };
    }

    // Field filter
    if (req.query.field) {
      query.fields = { 
        $in: [mongoose.Types.ObjectId(req.query.field)] 
      };
    }

    const certifications = await Certification.find(query)
      .populate("fields")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications,
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
    const certification = await Certification.findById(req.params.id).populate(
      "fields"
    );

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
  try {
    // Validate required fields
    const requiredFields = [
      "name",
      "shortDescription",
      "description",
      "certificationType",
      "callToAction",
      "fields",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Validate fields array is not empty
    if (!Array.isArray(req.body.fields) || req.body.fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    // Optional: Sanitize and trim the input data
    req.body.name = req.body.name.trim();
    req.body.shortDescription = req.body.shortDescription.trim();
    req.body.description = req.body.description.trim();
    req.body.certificationType = req.body.certificationType.trim();
    req.body.callToAction = req.body.callToAction.trim();

    // Optionally: Validate shortDescription (word count or length check)
    const wordCount = req.body.shortDescription.split(" ").length;
    if (wordCount < 15 || wordCount > 18) {
      return res.status(400).json({
        success: false,
        message: "Short description should be between 15 to 18 words.",
      });
    }

    const existingCert = await Certification.findOne({
      name: req.body.name.trim(),
    });
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: "Certification with this name already exists",
        error: "DUPLICATE_NAME",
      });
    }

    const certification = await Certification.create({
      name: req.body.name,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      certificationType: req.body.certificationType,
      callToAction: req.body.callToAction,
      fields: req.body.fields,
      durationInMonths: req.body.durationInMonths || 12,
    });

    res.status(201).json({
      success: true,
      data: certification,
    });
  }  catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Certification name must be unique',
        error: 'DUPLICATE_NAME'
      });
    }
    
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

    if (req.body.name) {
      const existingCert = await Certification.findOne({ 
        name: req.body.name.trim(),
        _id: { $ne: req.params.id } // Exclude current certification
      });
      
      if (existingCert) {
        return res.status(400).json({
          success: false,
          message: 'Another certification with this name already exists',
          error: 'DUPLICATE_NAME'
        });
      }
    }
    // Validate fields array is not empty if provided
    if (
      req.body.fields &&
      (!Array.isArray(req.body.fields) || req.body.fields.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    const certification = await Certification.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        certificationType: req.body.certificationType,
        callToAction: req.body.callToAction,
        fields: req.body.fields,
        durationInMonths: req.body.durationInMonths,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("fields");

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
  }  catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Certification name must be unique',
        error: 'DUPLICATE_NAME'
      });
    }
    
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
        message: "Certification not found",
      });
    }

    // Check if any companies have this certification
    const companyCount = await CompanyCertification.countDocuments({
      certification: req.params.id,
    });

    if (companyCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete certification as it is assigned to one or more companies",
        error: "REFERENCE_ERROR",
      });
    }

    await certification.deleteOne();

    res.status(200).json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Delete certification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting certification",
      error: error.message,
    });
  }
};

// Get certification types
exports.getCertificationTypes = async (req, res) => {
  try {
    // Distinct query to get unique certification types
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

// Get public certifications (for website visitors)
exports.getPublicCertifications = async (req, res) => {
  try {
    const query = {};

    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by certificationType if provided
    if (req.query.type) {
      query.certificationType = { $regex: new RegExp(req.query.type, 'i') };
    }

    const certifications = await Certification.find(query)
      .select("name shortDescription certificationType durationInMonths")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: certifications.length,
      data: certifications,
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
    const certification = await Certification.findById(req.params.id)
      .select(
        "name description certificationType callToAction durationInMonths"
      );

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
