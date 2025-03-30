const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Embed training type directly
  trainingType: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  // Fields as references for better reusability
  fields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field'
  }],
  durationInHours: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
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

// Index for better search performance
trainingSchema.index({ name: 'text', description: 'text', 'trainingType.name': 'text' });

module.exports = mongoose.model('Training', trainingSchema);