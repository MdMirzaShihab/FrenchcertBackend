const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originCountry: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  employeeCount: {
    type: Number,
    required: true,
    min: 1
  },
  scope: {
    type: String,
    trim: true
  },
  fields: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Field',
    required: true
  }],
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    }
  },
}, { timestamps: true });

// Compound index for searching companies
companySchema.index({ name: 'text', scope: 'text' });

module.exports = mongoose.model('Company', companySchema);