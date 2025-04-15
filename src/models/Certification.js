const mongoose = require("mongoose");

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
        validator: function (v) {
          // Split the string by spaces and count the number of words
          const wordCount = v.split(/\s+/).length;
          return wordCount >= 15 && wordCount <= 18;
        },
        message: 'shortDescription must contain between 15 to 18 words',
      },
    },
    description: {
      type: String,
      required: true,
    },
    certificationType: {
      type: String,
      required: true,
      trim: true,
    },
    callToAction: {
      type: String,
      required: true,
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
    },
  },
  { timestamps: true }
);

// Indexing
certificationSchema.index({ name: 'text', certificationType: 'text' }); // Text index for searching
certificationSchema.index({ certificationType: 1 }); // Regular index for type filtering
certificationSchema.index({ fields: 1 }); // Index for fields filtering

module.exports = mongoose.model("Certification", certificationSchema);