const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CompanySchema = new mongoose.Schema({
  companyID: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  companyOrigin: { type: String, required: true },
  companyCategory: { type: String, required: true },
  companyScope: { type: String, required: true },
  companyEmail: { type: String, required: true, unique: true },
  companyPhone: { type: String, required: true },
  companyAddress: { type: String, required: true },
  password: { type: String, required: true },
  validity: { type: Boolean, default: true },
  certificationList: [{
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    issueDate: Date,
    FirstSurveillanceDate: Date,
    SecondSurveillanceDate: Date,
    expiryDate: Date,
    Accreditation: String,
    status: { type: String, default: 'Active' },
    validity: { type: Boolean, default: true },
  }],
}, { timestamps: true });

// Hash password before saving
CompanySchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Company', CompanySchema);
