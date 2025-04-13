const mongoose = require("mongoose");

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

// Text indexing
certificationSchema.index({
    name: "text",
    certificationType: "text",
  });

module.exports = mongoose.model("Certification", certificationSchema);