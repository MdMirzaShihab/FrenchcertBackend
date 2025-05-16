const { body } = require('express-validator');

exports.validateCompanyInquiry = [
  body('companyName')
    .notEmpty()
    .withMessage('Company name is required')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('serviceType')
    .notEmpty()
    .withMessage('Service type is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Service type cannot exceed 100 characters'),
  
  body('contactNumber')
    .notEmpty()
    .withMessage('Contact number is required')
    .trim()
    .matches(/^[\d\s\+\-\(\)]{7,20}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  
  body('trainingInterests')
    .optional()
    .isArray()
    .withMessage('Training interests must be an array'),
  
  body('trainingInterests.*')
    .isMongoId()
    .withMessage('Invalid training ID format'),
  
  body('certificationInterests')
    .optional()
    .isArray()
    .withMessage('Certification interests must be an array'),
  
  body('certificationInterests.*')
    .isMongoId()
    .withMessage('Invalid certification ID format')
];