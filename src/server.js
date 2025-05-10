const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { MONGO_URI } = require('./config/secret');
const app = require('./app');
const logger = require('./utils/logger');


// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: process.env.NODE_ENV !== 'production' 
})
.then(() => console.log('MongoDB Connected'))
.catch((err) => {
  logger.error('MongoDB connection error:', err);
  process.exit(1);
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated!');
  });
});
