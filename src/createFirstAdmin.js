require('dotenv').config();
const config = require('./config/secret');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createFirstAdmin() {
  try {
    // Validate configuration
    if (!config.MONGO_URI) {
      throw new Error('MongoDB connection URI is not configured');
    }

    // Connect to MongoDB
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if any admin exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists:', adminExists.email);
      await mongoose.disconnect();
      return;
    }

    // Create first admin
    const admin = new User({
      email: 'admin@example.com', // Change this to your desired admin email
      password: 'StrongAdminPassword123!', // Change this immediately after first login
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('First admin user created successfully:');
    console.log(`Email: ${admin.email}`);
    console.log('IMPORTANT: Change this password immediately after first login!');
    
  } catch (err) {
    console.error('Error creating first admin:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createFirstAdmin();