const PendingAction = require('../models/PendingAction');
const Field = require('../models/Field');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { checkPendingFieldAction, checkPendingFieldNameExists } = require('../utils/pendingActionHelpers');

// Helper functions - reuse from existing fieldController
const validateFieldData = (data) => {
  const requiredFields = ["name"];
  return requiredFields.filter((field) => !data[field]);
};

const prepareFieldData = (body) => ({
  name: body.name?.trim(),
  description: body.description,
});

// Request creation of a new field
exports.requestCreateField = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const missingFields = validateFieldData(req.body);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const fieldData = prepareFieldData(req.body);
    
    // Check if a field with the same name already exists
    const existingField = await Field.findOne({ name: fieldData.name });
    if (existingField) {
      return res.status(400).json({
        success: false,
        message: 'Field with this name already exists',
      });
    }
    
    // Check if there's already a pending creation request for a field with the same name
    const existingPendingAction = await checkPendingFieldNameExists(fieldData.name);
    
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending request for a field with this name already exists',
      });
    }

    // Create a new pending action
    const pendingAction = new PendingAction({
      actionType: 'create',
      resourceType: 'Field',
      data: fieldData,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(201).json({
      success: true,
      message: 'Field creation request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit field creation request',
      error: error.message,
    });
  }
};

// Request update of an existing field
exports.requestUpdateField = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID format",
      });
    }

    // Check if the field exists
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }

    const updateData = prepareFieldData(req.body);
    
    // If name is changing, check if the new name already exists
    if (updateData.name && updateData.name !== field.name) {
      const existingField = await Field.findOne({ 
        name: updateData.name,
        _id: { $ne: field._id }
      });
      
      if (existingField) {
        return res.status(400).json({
          success: false,
          message: 'Field with this name already exists',
        });
      }
      
      // Check if there's a pending action with this name using the helper
      const existingPendingName = await checkPendingFieldNameExists(updateData.name, field._id);
      
      if (existingPendingName) {
        return res.status(400).json({
          success: false,
          message: 'A pending request for a field with this name already exists', 
        });
      }
    }
    
    // Check if there's already a pending update request for this field using the helper
    const existingPendingAction = await checkPendingFieldAction(field._id, 'update');
    
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending update request for this field already exists',
      });
    }

    // Create a new pending action
    const pendingAction = new PendingAction({
      actionType: 'update',
      resourceType: 'Field',
      resourceId: field._id,
      data: updateData,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(200).json({
      success: true,
      message: 'Field update request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit field update request',
      error: error.message,
    });
  }
};

// Request deletion of an existing field
exports.requestDeleteField = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid field ID format",
      });
    }

    // Check if the field exists
    const field = await Field.findById(req.params.id);
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found',
      });
    }
    
    // Check if there's already a pending delete request for this field using the helper
    const existingPendingAction = await checkPendingFieldAction(field._id, 'delete');
    
    if (existingPendingAction) {
      return res.status(400).json({
        success: false,
        message: 'A pending delete request for this field already exists',
      });
    }

    // Create a new pending action
    const pendingAction = new PendingAction({
      actionType: 'delete',
      resourceType: 'Field',
      resourceId: field._id,
      requestedBy: req.user.id,
      status: 'pending'
    });
    
    await pendingAction.save();
    
    return res.status(200).json({
      success: true,
      message: 'Field deletion request submitted for admin approval',
      pendingAction: {
        id: pendingAction._id,
        actionType: pendingAction.actionType,
        resourceType: pendingAction.resourceType,
        status: pendingAction.status,
        createdAt: pendingAction.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit field deletion request',
      error: error.message,
    });
  }
};

// Get field pending actions for the current user
exports.getUserFieldPendingActions = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build query based on filters
    const query = { 
      requestedBy: req.user.id,
      resourceType: 'Field'
    };
    
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
    
    return res.status(200).json({
      success: true,
      data: {
        actions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending actions',
      error: error.message,
    });
  }
};