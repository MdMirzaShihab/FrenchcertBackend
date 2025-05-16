const PendingAction = require('../models/PendingAction');

// Helper function to check if a field already has a pending action
const checkPendingFieldAction = async (fieldId = null, actionType = null, userId = null) => {
  const query = {
    resourceType: 'Field',
    status: 'pending'
  };
  
  if (fieldId) {
    query.resourceId = fieldId;
  }
  
  if (actionType) {
    query.actionType = actionType;
  }
  
  if (userId) {
    query.requestedBy = userId;
  }
  
  return await PendingAction.findOne(query);
};

// Helper function to get all pending actions for a field
const getAllPendingFieldActions = async (fieldId) => {
  const query = {
    resourceType: 'Field',
    resourceId: fieldId,
    status: 'pending'
  };
  
  return await PendingAction.find(query).sort('-createdAt');
};

// Helper function to check if a field name is used in pending actions
const checkPendingFieldNameExists = async (name, excludeFieldId = null) => {
  const query = {
    resourceType: 'Field',
    status: 'pending',
    $or: [
      { actionType: 'create', 'data.name': name },
      { actionType: 'update', 'data.name': name }
    ]
  };
  
  // If we're updating a field, exclude its own pending actions
  if (excludeFieldId) {
    query.$or[1].resourceId = { $ne: excludeFieldId };
  }
  
  return await PendingAction.findOne(query);
};

module.exports = {
  checkPendingFieldAction,
  checkPendingFieldNameExists,
  getAllPendingFieldActions
};