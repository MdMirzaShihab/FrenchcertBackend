const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const companyTrainingSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  training: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  trainingDate: {
    type: Date,
    required: true
  },
  employeeCount: {
    type: Number,
    required: true,
    min: 1
  },
  trainingId: {
    type: String,
    required: true,
    unique: true,
    default: () => `FTRN-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  notes: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for specific company trainings
companyTrainingSchema.index({ company: 1, training: 1 });
// Index for training ID lookups
companyTrainingSchema.index({ trainingId: 1 });
// Index for finding recent trainings
companyTrainingSchema.index({ trainingDate: 1 });

module.exports = mongoose.model('CompanyTraining', companyTrainingSchema);