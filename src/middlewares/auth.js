const jwt = require("jsonwebtoken");
const httpErrors = require("http-errors");
const rateLimit = require("express-rate-limit");

exports.authenticate = (req, res, next) => {
  try {
    console.log('Cookies:', req.cookies); // Debug cookies
    console.log('Headers:', req.headers); // Debug headers
    // Get token from cookies or Authorization header
    const token =
      req.cookies.accessToken ||
      (req.headers.authorization && req.headers.authorization.split(" ")[1]);

    if (!token) throw httpErrors(401, "Authentication required");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(httpErrors(401, "Token expired"));
    } else if (err instanceof jwt.JsonWebTokenError) {
      return next(httpErrors(401, "Invalid token"));
    }
    next(httpErrors(401, "Authentication failed"));
  }
};

exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(httpErrors(403, "Unauthorized access"));
    }
    next();
  };
};

// Rate limiting middleware for login attempts
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per IP
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF protection middleware
exports.csrfProtection = (req, res, next) => {
  // Skip CSRF check for non-modifying operations
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const clientToken =
    req.headers["x-csrf-token"] || req.headers["x-xsrf-token"];
  const serverToken = req.cookies["XSRF-TOKEN"];

  if (!clientToken || !serverToken || clientToken !== serverToken) {
    return next(httpErrors(403, "CSRF token validation failed"));
  }

  next();
};
