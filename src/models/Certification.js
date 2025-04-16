const mongoose = require("mongoose");
const sanitizeHtml = require('sanitize-html');
mongoose.plugin(require('mongoose-paginate-v2'));

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v) {
          const wordCount = v.trim().split(/\s+/).filter(word => word.length > 0).length;
          return wordCount >= 10 && wordCount <= 20;
        },
        message: 'shortDescription must contain between 10 to 20 words',
      },
    },
    description: {
      type: String,
      required: true,
      set: (value) => sanitizeHtml(value, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          a: ['href', 'name', 'target', 'rel'],
          img: ['src', 'alt', 'width', 'height']
        },
        allowedSchemes: ['http', 'https', 'data']
      })
    },
    certificationType: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    callToAction: {
      type: String,
      required: true,
      trim: true
    },
    fields: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Field",
          required: true,
        },
      ],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "At least one field is required.",
      },
      required: [true, "Fields are required."],
    },
    durationInMonths: {
      type: Number,
      min: 1,
      required: true
    },
  },
  { timestamps: true }
);

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