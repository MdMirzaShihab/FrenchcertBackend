const mongoose = require('mongoose');

const actionTypes = ['create', 'update', 'delete'];
const resourceTypes = ['Certification', 'Company', 'CompanyCertification', 'CompanyTraining', 'Field', 'Training'];

const pendingActionSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: actionTypes,
    required: true
  },
  resourceType: {
    type: String,
    enum: resourceTypes,
    required: true
  },
  resourceId: mongoose.Schema.Types.ObjectId,
  data: mongoose.Schema.Types.Mixed,
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: Date,
  rejectionReason: String  
}, { timestamps: true });

// Index to improve query performance
pendingActionSchema.index({ status: 1 });
pendingActionSchema.index({ requestedBy: 1, status: 1 });
pendingActionSchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model('PendingAction', pendingActionSchema);