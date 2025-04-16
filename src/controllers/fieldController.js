const Field = require('../models/Field');
const Certification = require('../models/Certification');
const Training = require('../models/Training');
const Company = require('../models/Company');

// Get all fields with optional filtering and pagination
exports.getAllFields = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {};
    

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    
    }

    const skip = (page - 1) * limit;
    
    const [fields, total] = await Promise.all([
      Field.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Field.countDocuments(query)
    ]);
      
    res.status(200).json({
      success: true,
      count: fields.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: fields
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
  try {
    const { name, description } = req.body;
    
    const field = await Field.create({
      name,
      description
    });
    
    res.status(201).json({
      success: true,
      data: field
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create field',
      error: error.message
    });
  }
};

// Update field
exports.updateField = async (req, res) => {
  try {
    const { name, description } = req.body;
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    );
    
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
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update field',
      error: error.message
    });
  }
};

// Delete field with reference check
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    
    // Comprehensive reference check
    const [certifications, trainings, companies] = await Promise.all([
      Certification.countDocuments({ fields: field._id }),
      Training.countDocuments({ fields: field._id }),
      Company.countDocuments({ fields: field._id })
    ]);
    
    if (certifications > 0 || trainings > 0 || companies > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete field as it is referenced in other documents',
        references: {
          certifications: certifications,
          trainings: trainings,
          companies: companies,
          suggestion: 'Consider deactivating instead of deleting'
        }
      });
    }
    
    await Field.deleteOne({ _id: field._id });
    
    res.status(200).json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete field',
      error: error.message
    });
  }
};