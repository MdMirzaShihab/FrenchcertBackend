const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const csrf = require("csurf");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const hpp = require("hpp");

const fieldRouter = require("./routes/fieldRouter");
const certificationRouter = require("./routes/certificationRouter");
const trainingRouter = require("./routes/trainingRouter");
const companyRouter = require("./routes/companyRouter");
const companyCertificationRouter = require("./routes/companyCertificationRouter");
const dashboardRouter = require("./routes/dashboardRouter");
const authRouter = require("./routes/authRouter");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");

// Import middleware
const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");

// Create Express app
const app = express();

// Global middleware
// Set security HTTP headers
app.use(helmet());

// Morgan request logger
app.use(morgan("combined", { stream: logger.stream }));

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Cookie parser
app.use(cookieParser());

// CSRF protection
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  },
});

app.use(csrfProtection);

//Rooutes
app.use("/api/fields", fieldRouter);
app.use("/api/certifications", certificationRouter);
app.use("/api/trainings", trainingRouter);
app.use("/api/companies", companyRouter);
app.use("/api/company-certifications", companyCertificationRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);

// Default Route
app.get("/", (req, res) => {
  res.send("FrenchCert Backend Running");
});

// 404 route
app.all("*", (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl} on this server!`,
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
