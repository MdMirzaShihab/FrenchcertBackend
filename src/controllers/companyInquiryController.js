const CompanyInquiry = require('../models/CompanyInquiry');
const Training = require('../models/Training');
const Certification = require('../models/Certification');
const mongoose = require('mongoose');

// Helper functions
const validateTrainingIds = async (ids) => {
  if (!ids || ids.length === 0) return true;
  const trainings = await Training.find({ _id: { $in: ids } });
  return trainings.length === ids.length;
};

const validateCertificationIds = async (ids) => {
  if (!ids || ids.length === 0) return true;
  const certifications = await Certification.find({ _id: { $in: ids } });
  return certifications.length === ids.length;
};

// Public - Create new inquiry
exports.createInquiry = async (req, res) => {
  try {
    const { 
      companyName, 
      address, 
      serviceType, 
      contactNumber, 
      email,
      trainingInterests = [], 
      certificationInterests = [] 
    } = req.body;

    // Validate training and certification IDs
    const [validTrainings, validCerts] = await Promise.all([
      validateTrainingIds(trainingInterests),
      validateCertificationIds(certificationInterests)
    ]);

    if (!validTrainings) {
      return res.status(400).json({
        success: false,
        message: 'One or more training interests are invalid'
      });
    }

    if (!validCerts) {
      return res.status(400).json({
        success: false,
        message: 'One or more certification interests are invalid'
      });
    }

    // Create inquiry
    const inquiry = await CompanyInquiry.create({
      companyName,
      address,
      serviceType,
      contactNumber,
      email,
      trainingInterests,
      certificationInterests,
      createdBy: req.user?._id || null
    });

    res.status(201).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create inquiry',
      error: error.message
    });
  }
};

// Get all inquiries (protected)
exports.getAllInquiries = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'trainingInterests', select: 'name' },
        { path: 'certificationInterests', select: 'name' },
        { path: 'createdBy', select: 'name email' }
      ]
    };

    const result = await CompanyInquiry.paginate(query, options);

    res.status(200).json({
      success: true,
      data: {
        inquiries: result.docs,
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries',
      error: error.message
    });
  }
};

// Get single inquiry
exports.getInquiry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    const inquiry = await CompanyInquiry.findById(req.params.id)
      .populate('trainingInterests', 'name')
      .populate('certificationInterests', 'name')
      .populate('createdBy', 'name email')
      .populate('statusHistory.changedBy', 'name email');

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiry',
      error: error.message
    });
  }
};

// Update inquiry status (protected)
exports.updateStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    const inquiry = await CompanyInquiry.findById(req.params.id).session(session);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Add to status history
    inquiry.statusHistory.push({
      status: inquiry.status,
      changedBy: req.user._id,
      notes: notes || `Status changed to ${status}`,
      changedAt: new Date()
    });

    // Update current status
    inquiry.status = status;
    if (notes) inquiry.notes = notes;

    await inquiry.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Failed to update inquiry status',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// Delete inquiry (admin only)
exports.deleteInquiry = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inquiry ID'
      });
    }

    const inquiry = await CompanyInquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete inquiry',
      error: error.message
    });
  }
};