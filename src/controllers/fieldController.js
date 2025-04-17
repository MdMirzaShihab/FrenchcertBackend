const Field = require('../models/Field');
const Certification = require('../models/Certification');
const Training = require('../models/Training');
const Company = require('../models/Company');
const mongoose = require('mongoose');


// Helper functions
const buildSearchQuery = (searchTerm) => ({
  $or: [
    { name: { $regex: searchTerm, $options: 'i' } },
    { description: { $regex: searchTerm, $options: 'i' } }
  ]
});

const validateFieldData = (data) => {
  const requiredFields = ['name'];
  return requiredFields.filter((field) => !data[field]);
};

const prepareFieldData = (body) => ({
  name: body.name?.trim(),
  description: body.description
});


// Get all fields with optional filtering and pagination
exports.getAllFields = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};


    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { name: 1 },
      collation: { locale: 'en', strength: 2 } // Case-insensitive sorting
    };
    

    if (search) Object.assign(query, buildSearchQuery(search));

    const result = await Field.paginate(query, options);
    
    return res.status(200).json({
      success: true,
      data: {
        fields: result.docs,
        total: result.totalDocs,
        limit: result.limit,
        page: result.page,
        pages: result.totalPages,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fields',
      error: error.message
    });
  }
};

// Get single field with references
exports.getField = async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID format'
      });
    }

const field = await Field.findById(req.params.id)
      .populate('certifications', 'name certificationType')
      .populate('trainings', 'name trainingType')
      .populate('companies', 'name category');
      
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch field',
      error: error.message
    });
  }
};

// Create new field
exports.createField = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const missingFields = validateFieldData(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const fieldData = prepareFieldData(req.body);
    const field = await Field.create([fieldData], { session });

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      data: field[0]
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create field',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Update field
exports.updateField = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID format'
      });
    }

    const updateData = prepareFieldData(req.body);
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true, session }
    );

    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      data: field
    });
  } catch (error) {
    await session.abortTransaction();

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update field',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Delete field with reference check
exports.deleteField = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid field ID format'
      });
    }

    const field = await Field.findById(req.params.id).session(session);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    // Comprehensive reference check
    const [certifications, trainings, companies] = await Promise.all([
      Certification.countDocuments({ fields: field._id }).session(session),
      Training.countDocuments({ fields: field._id }).session(session),
      Company.countDocuments({ fields: field._id }).session(session)
    ]);
    
    if (certifications > 0 || trainings > 0 || companies > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete field as it is referenced in other documents',
        references: {
          certifications,
          trainings,
          companies
        }
      });
    }

    await Field.deleteOne({ _id: field._id }).session(session);
    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: 'Failed to delete field',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};