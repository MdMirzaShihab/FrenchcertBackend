const { body } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

exports.validatePageRequest = [
  body('name')
    .notEmpty()
    .withMessage('Page name is required')
    .isString()
    .withMessage('Page name must be a string')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Page name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('Page name can only contain letters, numbers, spaces, and hyphens'),
  
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('body')
    .notEmpty()
    .withMessage('Content body is required')
    .isString()
    .withMessage('Content body must be a string')
    .customSanitizer(value => sanitizeHtml(value, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target', 'rel'],
        img: ['src', 'alt', 'width', 'height']
      },
      allowedSchemes: ['http', 'https', 'data']
    }))
    .isLength({ min: 50 })
    .withMessage('Content body must be at least 50 characters long'),
  
  body('seoKeywords')
    .optional()
    .isArray()
    .withMessage('SEO keywords must be an array')
    .custom((keywords) => {
      if (keywords.length > 10) {
        throw new Error('Maximum of 10 SEO keywords allowed');
      }
      return true;
    }),
  
  body('seoKeywords.*')
    .optional()
    .isString()
    .withMessage('Each SEO keyword must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Each SEO keyword cannot exceed 50 characters'),
  
  body('seoDescription')
    .optional()
    .isString()
    .withMessage('SEO description must be a string')
    .trim()
    .isLength({ max: 160 })
    .withMessage('SEO description cannot exceed 160 characters')
];