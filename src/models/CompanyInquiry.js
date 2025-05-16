const mongoose = require('mongoose');

const CompanyInquirySchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    trim: true,
    maxlength: [100, 'Service type cannot exceed 100 characters']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^[\d\s\+\-\(\)]{7,20}$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  trainingInterests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid training ID`
    }
  }],
  certificationInterests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certification',
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: props => `${props.value} is not a valid certification ID`
    }
  }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'registered', 'rejected'],
    default: 'new'
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['new', 'contacted', 'registered', 'rejected']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    changedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
CompanyInquirySchema.index({ companyName: 1 });
CompanyInquirySchema.index({ status: 1 });
CompanyInquirySchema.index({ createdAt: -1 });
CompanyInquirySchema.index({ 'trainingInterests': 1 });
CompanyInquirySchema.index({ 'certificationInterests': 1 });

// Virtual for formatted contact number
CompanyInquirySchema.virtual('formattedContact').get(function() {
  return this.contactNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
});

module.exports = mongoose.model('CompanyInquiry', CompanyInquirySchema);