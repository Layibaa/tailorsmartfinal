// server/scripts/seed.js - Create initial superadmin only
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create superadmin if doesn't exist
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@tailorsmart.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'superadmin',
        status: 'active',
        isVerified: true,
        city: 'Karachi'
      });
      console.log(' Superadmin created:', superAdmin.email);
    } else {
      console.log(' Superadmin already exists');
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Superadmin: superadmin@tailorsmart.com / admin123');

  } catch (error) {
    console.error(' Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;