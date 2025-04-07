const Training = require('../models/Training');

// Get all trainings
exports.getAllTrainings = async (req, res) => {
  try {
    const query = {};
    
    // Filter by trainingType if provided
    if (req.query.type) {
      query.trainingType = req.query.type;
    }
    
    // Filter by trainingMethod if provided
    if (req.query.method) {
      query.trainingMethod = req.query.method;
    }
    
    // Text search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }
    
    // Field filter
    if (req.query.field) {
      query.fields = req.query.field;
    }
    
    const trainings = await Training.find(query)
      .populate('fields')
      .sort({ name: 1 });
      
    res.status(200).json({
      success: true,
      count: trainings.length,
      data: trainings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainings',
      error: error.message
    });
  }
};

// Get single training
exports.getTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('fields');
      
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training',
      error: error.message
    });
  }
};

// Create new training
exports.createTraining = async (req, res) => {
  try {
    const training = await Training.create(req.body);
    
    res.status(201).json({
      success: true,
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create training',
      error: error.message
    });
  }
};

// Update training
exports.updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('fields');
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update training',
      error: error.message
    });
  }
};

// Delete training
exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }
    
    // Check if training is assigned to any companies
    // Implement reference check if needed
    
    await training.remove();
    
    res.status(200).json({
      success: true,
      message: 'Training deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete training',
      error: error.message
    });
  }
};

// Get training types
exports.getTrainingTypes = async (req, res) => {
  try {
    // Distinct query to get unique training types
    const types = await Training.distinct('trainingType');
    
    res.status(200).json({
      success: true,
      count: types.length,
      data: types
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training types',
      error: error.message
    });
  }
};

// Get training methods
exports.getTrainingMethods = async (req, res) => {
  try {
    // Return the enum values
    const methods = ["online", "in-person", "hybrid"];
    
    res.status(200).json({
      success: true,
      count: methods.length,
      data: methods
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training methods',
      error: error.message
    });
  }
};
