const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/secret');
const Company = require('../models/Company');

// Middleware to verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized, no token provided' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach the company profile to request object
    req.company = await Company.findById(decoded.id).select('-password');
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware for admin access
exports.adminOnly = (req, res, next) => {
  if (!req.company || req.company.companyCategory !== 'admin') {
    return res.status(403).json({ error: 'Forbidden, admin access only' });
  }
  next();
};
