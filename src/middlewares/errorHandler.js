const logger = require('../utils/logger'); // You'll need to implement this

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user ? req.user.id : 'unauthenticated'
  });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // HTTP errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Server Error' 
      : err.message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;


// validators/auth.js
const { body } = require('express-validator');
const User = require('../models/User');

exports.validateRegister = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
    .custom(async email => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already in use');
      }
    }),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
    .trim(),
  
  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Invalid role')
];

exports.validateLogin = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
];

exports.validateForgotPassword = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
];

exports.validateResetPassword = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain at least one number')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
    .trim()
];

exports.validateUpdatePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/\d/).withMessage('New password must contain at least one number')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('New password must contain at least one special character')
    .trim()
];