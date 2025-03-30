const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const serviceCategoryRoutes = require('./routes/serviceCategoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Logging requests in development mode
app.use(morgan('dev'));

// Parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Rate limiter to prevent excessive requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: "Too many requests from this IP, please try again later" },
});
app.use('/api/', limiter);

// Routes
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/auth', authRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('FrenchCert Backend Running');
});


module.exports = app;