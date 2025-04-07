const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Index on description for better search performance
fieldSchema.index({ description: 'text' });

module.exports = mongoose.model('Field', fieldSchema);