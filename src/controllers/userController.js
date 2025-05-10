const PendingAction = require('../models/PendingAction');
const { validationResult } = require('express-validator');

// Create a new pending action request
exports.createPendingAction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { actionType, resourceType, resourceId, data } = req.body;
    
    // Validate that resource exists for update/delete actions
    if (actionType !== 'create' && !resourceId) {
      return res.status(400).json({ 
        message: 'Resource ID is required for update/delete actions' 
      });
    }
    
    // Create a new pending action
    const pendingAction = new PendingAction({
      actionType,
      resourceType,
      resourceId: actionType !== 'create' ? resourceId : undefined,
      data,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    res.status(201).json({ 
      success: true,
      message: 'Request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType,
        resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get pending actions for the current user
exports.getUserPendingActions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query based on filters
    const query = { requestedBy: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    const actions = await PendingAction.find(query)
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

// Get a specific pending action
exports.getUserPendingActionById = async (req, res, next) => {
  try {
    const action = await PendingAction.findOne({
      _id: req.params.actionId,
      requestedBy: req.user.id
    });
    
    if (!action) {
      return res.status(404).json({ message: 'Action not found' });
    }
    
    res.json(action);
  } catch (err) {
    next(err);
  }
};

// Cancel a pending action (only if it's still pending)
exports.cancelPendingAction = async (req, res, next) => {
  try {
    const action = await PendingAction.findOne({
      _id: req.params.actionId,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    if (!action) {
      return res.status(404).json({ 
        message: 'Pending action not found or already processed' 
      });
    }
    
    await action.deleteOne();
    
    res.json({ 
      success: true,
      message: 'Pending action cancelled successfully' 
    });
  } catch (err) {
    next(err);
  }
};