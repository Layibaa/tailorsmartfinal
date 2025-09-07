// ====================
// server/scripts/createAdminUser.js
// ====================
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@tailorsmart.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const admin = await Admin.create({
      name: 'Super Admin',
      email: 'admin@tailorsmart.com',
      password: 'admin123',
      role: 'superadmin'
    });

    console.log('Admin user created successfully:');
    console.log('Email:', admin.email);
    console.log('Role:', admin.role);
    console.log('Permissions:', admin.permissions);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
  }
};

// Run the script
createAdminUser();
