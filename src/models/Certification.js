const mongoose = require("mongoose");
const sanitizeHtml = require('sanitize-html');
mongoose.plugin(require('mongoose-paginate-v2'));

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Certification name is required'],
      trim: true,
      unique: true,
      maxlength: [100, 'Certification name cannot exceed 100 characters'],
      minlength: [3, 'Certification name must be at least 3 characters long']
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      validate: {
        validator: function(v) {
          const wordCount = v.trim().split(/\s+/).filter(word => word.length > 0).length;
          return wordCount >= 10 && wordCount <= 20;
        },
        message: 'Short description must contain between 10 to 20 words',
      },
      maxlength: [200, 'Short description cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: true,
      set: (value) => sanitizeHtml(value, {
        allowedTags: sanitizeHtml.defaults.allowedTags, 
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          a: ['href', 'name', 'target', 'rel'] 
        },
        allowedSchemes: ['http', 'https'] 
      })
    },
    certificationType: {
      type: String,
      required: [true, 'Certification type is required'],
      trim: true,
      unique: true
    },
    callToAction: {
      type: String,
      required: [true, 'Call to action text is required'],
      trim: true,
      maxlength: [50, 'Call to action cannot exceed 50 characters']
    },
    fields: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Field",
          required: [true, 'Field reference is required'],
        },
      ],
      validate: {
        validator: function(value) {
          return Array.isArray(value) && value.length > 0 && value.length <= 5;
        },
        message: 'At least one field is required and maximum 5 fields allowed'
      },
      required: [true, "At least one field is required"]
    },
    durationInMonths: {
      type: Number,
      min: [1, 'Duration must be at least 1 month'],
      max: [99, 'Duration cannot exceed 36 months'],
      required: [true, 'Duration is required'],
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for duration in years (rounded to 1 decimal)
certificationSchema.virtual('durationInYears').get(function() {
  return parseFloat((this.durationInMonths / 12).toFixed(1));
});


// Case-insensitive text index
certificationSchema.index({ 
  name: 'text', 
  certificationType: 'text' 
}, {
  collation: { locale: 'en', strength: 2 } 
});

// Regular indexes
certificationSchema.index({ certificationType: 1 });
certificationSchema.index({ fields: 1 });

module.exports = mongoose.model("Certification", certificationSchema);