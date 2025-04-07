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
    fields: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Field",
      },
    ],
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
