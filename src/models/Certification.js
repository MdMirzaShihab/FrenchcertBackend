const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Embed certification type directly
  certificationType: {
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
  durationInMonths: {
    type: Number,
    required: true,
    min: 1
  },
  surveillanceRequired: {
    type: Boolean,
    default: true
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
certificationSchema.index({ name: 'text', description: 'text', 'certificationType.name': 'text' });

module.exports = mongoose.model('Certification', certificationSchema);
