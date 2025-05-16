const CompanyTraining = require('../models/CompanyTraining');
const Company = require('../models/Company');
const Training = require('../models/Training');

// Get all company trainings
exports.getAllCompanyTrainings = async (req, res) => {
  try {
    const query = {};
    
    // Filter by company
    if (req.query.company) {
      query.company = req.query.company;
    }
    
    // Filter by training
    if (req.query.training) {
      query.training = req.query.training;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by training method
    if (req.query.method) {
      query.trainingMethod = req.query.method;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.trainingDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    } else if (req.query.startDate) {
      query.trainingDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      query.trainingDate = { $lte: new Date(req.query.endDate) };
    }
    
    const companyTrainings = await CompanyTraining.find(query)
      .populate({
        path: 'company',
        select: 'name companyIdentifier'
      })
      .populate({
        path: 'training',
        select: 'name trainingType durationInHours'
      })
      .sort({ trainingDate: -1 });
      
    res.status(200).json({
      success: true,
      count: companyTrainings.length,
      data: companyTrainings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company trainings',
      error: error.message
    });
  }
};

// Get all companies with a specific training
exports.getCompaniesByTraining = async (req, res) => {
  try {
    const companyTrainings = await CompanyTraining.find({ 
      training: req.params.trainingId 
    })
      .populate({
        path: 'company',
        select: 'name companyIdentifier category'
      })
      .sort({ trainingDate: -1 });

    res.status(200).json({
      success: true,
      count: companyTrainings.length,
      data: companyTrainings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies with this training',
      error: error.message
    });
  }
};

// Get single company training
exports.getCompanyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findById(req.params.id)
      .populate('company')
      .populate('training');
      
    if (!companyTraining) {
      return res.status(404).json({
        success: false,
        message: 'Company training not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: companyTraining
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company training',
      error: error.message
    });
  }
};

// Create new company training
exports.createCompanyTraining = async (req, res) => {
  try {
    // Validate company exists
    const company = await Company.findById(req.body.company);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    
    // Validate training exists and get duration
    const training = await Training.findById(req.body.training);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // If nextRetrainingDate is not provided, calculate it from training duration
    if (!req.body.nextRetrainingDate && training.durationInHours) {
      const trainingDate = req.body.trainingDate ? new Date(req.body.trainingDate) : new Date();
      const nextRetrainingDate = new Date(trainingDate);
      
      // Assuming retraining is needed after 1 year (adjust as needed)
      nextRetrainingDate.setFullYear(nextRetrainingDate.getFullYear() + 1);
      req.body.nextRetrainingDate = nextRetrainingDate;
    }

    const companyTraining = await CompanyTraining.create(req.body);
    
    res.status(201).json({
      success: true,
      data: companyTraining
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Training ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create company training',
      error: error.message
    });
  }
};

// Update company training
exports.updateCompanyTraining = async (req, res) => {
  try {
    // Get the existing training first
    const existingTraining = await CompanyTraining.findById(req.params.id)
      .populate('training');
    
    if (!existingTraining) {
      return res.status(404).json({
        success: false,
        message: 'Company training not found'
      });
    }

    // Check if we need to recalculate next retraining date
    if (req.body.trainingDate && !req.body.nextRetrainingDate && existingTraining.training?.durationInHours) {
      const newTrainingDate = new Date(req.body.trainingDate);
      const newRetrainingDate = new Date(newTrainingDate);
      
      // Assuming retraining is needed after 1 year (adjust as needed)
      newRetrainingDate.setFullYear(newRetrainingDate.getFullYear() + 1);
      req.body.nextRetrainingDate = newRetrainingDate;
    }

    // Perform the update
    const updatedTraining = await CompanyTraining.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('company')
      .populate('training');

    res.status(200).json({
      success: true,
      data: updatedTraining
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Training ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update company training',
      error: error.message
    });
  }
};

// Delete company training
exports.deleteCompanyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findById(req.params.id);
    
    if (!companyTraining) {
      return res.status(404).json({
        success: false,
        message: 'Company training not found'
      });
    }
    
    await CompanyTraining.deleteOne({ _id: req.params.id });
    
    res.status(200).json({
      success: true,
      message: 'Company training deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company training',
      error: error.message
    });
  }
};

// Verify training by ID
exports.verifyTraining = async (req, res) => {
  try {
    const companyTraining = await CompanyTraining.findOne({
      trainingId: req.params.trainingId
    })
      .populate('company')
      .populate('training');
    
    if (!companyTraining) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }
    
    // Create verification response with limited data
    const verificationData = {
      trainingId: companyTraining.trainingId,
      company: {
        name: companyTraining.company.name,
        identifier: companyTraining.company.companyIdentifier
      },
      training: {
        name: companyTraining.training.name,
        type: companyTraining.training.trainingType,
        duration: companyTraining.training.durationInHours
      },
      trainingDate: companyTraining.trainingDate,
      status: companyTraining.status,
      trainingMethod: companyTraining.trainingMethod,
      isValid: companyTraining.status === 'Completed' && 
               companyTraining.certificateIssued === true
    };
    
    res.status(200).json({
      success: true,
      data: verificationData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify training',
      error: error.message
    });
  }
};

// Get company trainings dashboard stats
exports.getTrainingStats = async (req, res) => {
  try {
    const stats = {
      total: await CompanyTraining.countDocuments(),
      completed: await CompanyTraining.countDocuments({ 
        status: 'Completed'
      }),
      inProgress: await CompanyTraining.countDocuments({
        status: 'In Progress'
      }),
      requested: await CompanyTraining.countDocuments({
        status: 'Requested'
      }),
      needRetraining: await CompanyTraining.countDocuments({
        status: 'Time to Retrain'
      }),
      upcomingRetraining: await CompanyTraining.countDocuments({
        nextRetrainingDate: { 
          $gt: new Date(),
          $lt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // Next 90 days
        },
        status: { $ne: 'Time to Retrain' }
      }),
      recentTrainings: await CompanyTraining.countDocuments({
        trainingDate: { 
          $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          $lt: new Date()
        }
      })
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get training statistics',
      error: error.message
    });
  }
};