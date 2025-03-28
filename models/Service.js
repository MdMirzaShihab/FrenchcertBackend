const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  fields: {
    type: [String], // Example: ['IT', 'Healthcare']
    required: true,
  },
  description: {
    type: String, // This can be formatted text
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);
