const PendingAction = require('../models/PendingAction');
const Certification = require('../models/Certification');
const Company = require('../models/Company');
const CompanyCertification = require('../models/CompanyCertification');
const CompanyTraining = require('../models/CompanyTraining');
const Field = require('../models/Field');
const Training = require('../models/Training');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Helper function to get the model based on resource type
const getModelByResourceType = (resourceType) => {
  switch (resourceType) {
    case 'Certification':
      return Certification;
    case 'Company':
      return Company;
    case 'CompanyCertification':
      return CompanyCertification;
    case 'CompanyTraining':
      return CompanyTraining;
    case 'Field':
      return Field;
    case 'Training':
      return Training;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }
};

// Process any pending action
exports.processPendingAction = async (req, res, next) => {
  try {
    const { actionId, decision } = req.params;
    const { rejectionReason } = req.body;
    
    // Validate decision
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Invalid decision' });
    }
    
    // Find the pending action
    const pendingAction = await PendingAction.findById(actionId);
    
    if (!pendingAction) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    if (pendingAction.status !== 'pending') {
      return res.status(400).json({ message: 'Action already processed' });
    }
    
    // Update action status
    pendingAction.status = decision;
    pendingAction.reviewedBy = req.user.id;
    pendingAction.reviewDate = new Date();
    
    // Add rejection reason if provided and decision is 'rejected'
    if (decision === 'rejected' && rejectionReason) {
      pendingAction.rejectionReason = rejectionReason;
    }
    
    // If approved, perform the requested action
    if (decision === 'approved') {
      try {
        const Model = getModelByResourceType(pendingAction.resourceType);
        
        switch (pendingAction.actionType) {
          case 'create':
            const newInstance = new Model(pendingAction.data);
            await newInstance.save();
            break;
            
          case 'update':
            await Model.findByIdAndUpdate(
              pendingAction.resourceId,
              pendingAction.data,
              { runValidators: true, new: true }
            );
            break;
            
          case 'delete':
            await Model.findByIdAndDelete(pendingAction.resourceId);
            break;
            
          default:
            throw new Error(`Unknown action type: ${pendingAction.actionType}`);
        }
      } catch (error) {
        // If there's an error performing the action, mark it as rejected
        pendingAction.status = 'rejected';
        pendingAction.rejectionReason = `Error processing action: ${error.message}`;
      }
    }
    
    // Save the pending action with its updated status
    await pendingAction.save();
    
    res.json({ 
      message: `Action ${pendingAction.status}`,
      pendingAction
    });
  } catch (err) {
    next(err);
  }
};

// Get all pending actions
exports.getPendingActions = async (req, res, next) => {
  try {
    const { resourceType, status, page = 1, limit = 10 } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (resourceType) {
      query.resourceType = resourceType;
    }
    
    if (status) {
      query.status = status;
    } else {
      query.status = 'pending'; // Default to pending actions
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const actions = await PendingAction.find(query)
      .populate('requestedBy', 'email')
      .populate('reviewedBy', 'email')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));
    
    // Get total count for pagination
    const total = await PendingAction.countDocuments(query);
    
    res.json({
      actions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get details of a specific pending action
exports.getPendingActionById = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    
    const action = await PendingAction.findById(actionId)
      .populate('requestedBy', 'email')
      .populate('reviewedBy', 'email');
    
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    res.json(action);
  } catch (err) {
    next(err);
  }
};

// Admin can manage users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(query)
      .select('-password')
      .sort('email')
      .skip(skip)
      .limit(Number(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get a specific user
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Update a user's role or status
exports.updateUser = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const updates = {};
    
    if (role !== undefined) {
      updates.role = role;
    }
    
    if (isActive !== undefined) {
      updates.isActive = isActive;
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    next(err);
  }
};  