const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const serviceCategoryRoutes = require('./routes/serviceCategoryRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const companyRoutes = require('./routes/companyRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Routes
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/companies', companyRoutes);

// Default Route
app.get('/', (req, res) => {
  res.send('FrenchCert Backend Running');
});

module.exports = app;
