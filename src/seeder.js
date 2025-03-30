const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const ServiceCategory = require('./models/ServiceCategory');
const Service = require('./models/Service');
const Company = require('./models/Company');

dotenv.config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected for Seeding'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Dummy Data for Service Categories
const serviceCategories = [
  { name: 'Certification' },
  { name: 'Training' },
  { name: 'Accreditation' },
];

// Dummy Data for Services
const services = [
  {
    title: 'ISO 9001 Certification',
    fields: ['Quality Management', 'Standards'],
    description: 'ISO 9001 ensures quality management systems.',
    category: null, // Will be set dynamically
  },
  {
    title: 'Cybersecurity Training',
    fields: ['Cybersecurity', 'Network Security'],
    description: 'Learn about cybersecurity best practices.',
    category: null, // Will be set dynamically
  },
];

// Dummy Data for Companies
const companies = [
  {
    companyID: new mongoose.Types.ObjectId(),
    companyName: 'TechCorp Ltd.',
    companyOrigin: 'USA',
    validity: true,  // Boolean at root level
    companyCategory: 'certified',
    companyScope: 'Software Development',
    companyEmail: 'admin@techcorp.com',
    companyPhone: '+123456789',
    companyAddress: '123 Tech Street, NY',
    password: bcrypt.hashSync('password123', 10),
    certificationList: [],
    trainingsList: [],
  },
];

// Function to Seed Data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await ServiceCategory.deleteMany();
    await Service.deleteMany();
    await Company.deleteMany();

    console.log('Existing data removed');

    // Insert Service Categories
    const insertedCategories = await ServiceCategory.insertMany(serviceCategories);
    console.log('Service Categories Seeded');

    // Assign correct category IDs to services
    services[0].category = insertedCategories.find(cat => cat.name === 'Certification')._id;
    services[1].category = insertedCategories.find(cat => cat.name === 'Training')._id;

    // Insert Services
    const insertedServices = await Service.insertMany(services);
    console.log('Services Seeded');

    // Assign services to the company
    companies[0].certificationList.push({
      serviceId: insertedServices[0]._id,
      issueDate: new Date('2023-01-15'),
      firstSurveillanceDate: new Date('2024-01-15'),
      secondSurveillanceDate: new Date('2025-01-15'),
      expiryDate: new Date('2027-12-31'),
      accreditation: 'ISO Accreditation',
      status: 'Active',
      validUntil: new Date('2027-12-31'), // Updated field
    });

    companies[0].trainingsList.push({
      serviceId: insertedServices[1]._id,
      issueDate: new Date('2023-06-10'),
      expiryDate: new Date('2026-06-10'),
      accreditation: 'Cybersecurity Cert',
      status: 'Completed',
      validUntil: new Date('2026-12-31'), // Updated field
    });

    // Insert Companies
    await Company.insertMany(companies);
    console.log('Companies Seeded');

    console.log('Database Seeding Completed Successfully');
    process.exit();
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

// Run Seeder
seedDatabase();
