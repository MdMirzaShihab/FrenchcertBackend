const mongoose = require("mongoose");

const trainingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    trainingType: {
      type: String,
      required: true,
      trim: true,
    },
    trainingMethod: {
      type: [String],
      required: true,
      trim: true,
      enum: ["online", "in-person", "hybrid"],
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
    durationInHours: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true }
);

// Index for better search performance
trainingSchema.index({
  name: "text",
  description: "text",
  trainingType: "text",
});

module.exports = mongoose.model("Training", trainingSchema);
