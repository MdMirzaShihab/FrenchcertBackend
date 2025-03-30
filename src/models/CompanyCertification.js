const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const companyCertificationSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  certification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification',
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  firstSurveillanceDate: {
    type: Date
  },
  secondSurveillanceDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'expired'],
    default: 'active'
  },
  certificationId: {
    type: String,
    required: true,
    unique: true,
    default: () => `FCRT-${uuidv4().substring(0, 8).toUpperCase()}`
  },
  notes: {
    type: String,
    trim: true
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

// Compound index for specific company certifications
companyCertificationSchema.index({ company: 1, certification: 1 });
// Index for certification ID lookups
companyCertificationSchema.index({ certificationId: 1 });
// Index for finding expiring certifications
companyCertificationSchema.index({ expiryDate: 1, status: 1 });
// Index for finding certifications needing surveillance
companyCertificationSchema.index({ firstSurveillanceDate: 1, status: 1 });
companyCertificationSchema.index({ secondSurveillanceDate: 1, status: 1 });

module.exports = mongoose.model('CompanyCertification', companyCertificationSchema);