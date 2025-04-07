const Field = require('../models/Field');

// Get all fields
exports.getAllFields = async (req, res) => {
  try {
    const fields = await Field.find().sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: fields.length,
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

// Get single field
exports.getField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
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
    const field = await Field.create(req.body);
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
    const field = await Field.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// Delete field
exports.deleteField = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    
    // Check if field is used in certifications/trainings
    // Implement field reference check if needed
    
    await Field.deleteOne({ _id: req.params.id });
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