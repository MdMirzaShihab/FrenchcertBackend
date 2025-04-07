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
      trim: true,
    },
    certificationType: {
      type: String,
      required: true,
      trim: true,
    },
    fields: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Field",
      },
    ],
    durationInMonths: {
      type: Number,
      min: 1,
    },
  },
  { timestamps: true }
);

// Index for better search performance
certificationSchema.index({
    name: "text",
    description: "text",
    certificationType: "text",
  });

module.exports = mongoose.model("Certification", certificationSchema);
