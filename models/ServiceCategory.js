const mongoose = require('mongoose');

const ServiceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('ServiceCategory', ServiceCategorySchema);
