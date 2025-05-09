const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');

exports.authenticate = (req, res, next) => {
  try {
    // Get token from cookies instead of header
    const token = req.cookies.token;
    if (!token) throw httpErrors(401, 'Authentication required');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(httpErrors(401, 'Invalid or expired token'));
  }
};

exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(httpErrors(403, 'Unauthorized access'));
    }
    next();
  };
};