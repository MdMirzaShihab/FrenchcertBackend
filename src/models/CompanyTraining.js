const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const companyTrainingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company reference is required']
  },
  training: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: [true, 'Training reference is required']
  },
  trainingDate: {
    type: Date,
    required: [true, 'Training date is required']
  },
  nextRetrainingDate: {
    type: Date
  },
  employeeCount: {
    type: Number,
    required: [true, 'Employee count is required'],
    min: [1, 'Employee count must be at least 1']
  },
  trainingId: {
    type: String,
    required: true,
    unique: true,
    default: () => `FTRN-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Requested', 'In Progress', 'Completed', 'Time to Retrain'],
    default: 'Completed',
    required: true
  },
  trainingMethod: {
    type: String,
    enum: ['online', 'in-person', 'hybrid'],
    required: [true, 'Training method is required']
  },
  trainer: {
    type: String,
    trim: true,
    maxlength: [100, 'Trainer name cannot exceed 100 characters']
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssueDate: {
    type: Date
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for training duration (if needed from Training model)
companyTrainingSchema.virtual('duration').get(function() {
  return this.populated('training') ? this.training.durationInHours : null;
});

// Compound index for specific company trainings
companyTrainingSchema.index({ company: 1, training: 1 });
// Index for training ID lookups
companyTrainingSchema.index({ trainingId: 1 });
// Index for finding recent trainings
companyTrainingSchema.index({ trainingDate: 1 });
// Index for finding trainings needing retraining
companyTrainingSchema.index({ nextRetrainingDate: 1, status: 1 });
// Index for status filtering
companyTrainingSchema.index({ status: 1 });

module.exports = mongoose.model('CompanyTraining', companyTrainingSchema);