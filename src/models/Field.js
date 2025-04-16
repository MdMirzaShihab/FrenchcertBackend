const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field name is required'],
    trim: true,
    unique: [true, 'Field name must be unique'],
    minlength: [2, 'Field name must be at least 2 characters long'],
    maxlength: [100, 'Field name cannot exceed 100 characters'],
    match: [/^[a-zA-Z0-9\s\-]+$/, 'Field name can only contain letters, numbers, spaces, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
fieldSchema.index({ name: 1 });
fieldSchema.index({ description: 'text' });

// Virtual populate for referencing documents (for informational purposes only)
fieldSchema.virtual('certifications', {
  ref: 'Certification',
  localField: '_id',
  foreignField: 'fields',
  options: { select: 'name certificationType' }
});

fieldSchema.virtual('trainings', {
  ref: 'Training',
  localField: '_id',
  foreignField: 'fields',
  options: { select: 'name trainingType' }
});

fieldSchema.virtual('companies', {
  ref: 'Company',
  localField: '_id',
  foreignField: 'fields',
  options: { select: 'name category' }
});

// Schema-level validation messages
fieldSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Field name must be unique'));
  } else {
    next(error);
  }
});

module.exports = mongoose.model('Field', fieldSchema);