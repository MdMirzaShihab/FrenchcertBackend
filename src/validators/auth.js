const { body } = require('express-validator');
const User = require('../models/User');

exports.validateRegister = [
  body('email')
    .isEmail().withMessage('Please enter a valid email')
    .custom(async email => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already in use');
      }
    })
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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