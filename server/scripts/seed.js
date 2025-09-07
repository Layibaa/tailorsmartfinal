// server/scripts/seed.js - Create initial admin and sample data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Order.deleteMany({});
    // console.log('Cleared existing data');

    // Create superadmin if doesn't exist
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const superAdmin = await User.create({
        name: 'Super Admin',
        email: 'superadmin@tailorsmart.com',
        password: 'admin123', // Will be hashed by pre-save hook
        role: 'superadmin',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Superadmin created:', superAdmin.email);
    } else {
      console.log('✅ Superadmin already exists');
    }

    // Create admin if doesn't exist
    const existingAdmin = await User.findOne({ role: 'admin', email: 'admin@tailorsmart.com' });
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@tailorsmart.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Admin created:', admin.email);
    } else {
      console.log('✅ Admin already exists');
    }

    // Create support user if doesn't exist
    const existingSupport = await User.findOne({ role: 'support' });
    if (!existingSupport) {
      const support = await User.create({
        name: 'Support User',
        email: 'support@tailorsmart.com',
        password: 'support123',
        role: 'support',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Support user created:', support.email);
    }

    // Create sample tailor
    const existingTailor = await User.findOne({ role: 'tailor' });
    if (!existingTailor) {
      const tailor = await User.create({
        name: 'John Tailor',
        email: 'tailor@example.com',
        password: 'tailor123',
        role: 'tailor',
        status: 'active',
        isVerified: true,
        tailorProfile: {
          shopName: 'John\'s Tailoring',
          shopLocation: 'Downtown',
          experience: 5,
          specialties: ['formal wear', 'traditional'],
          rating: 4.5
        }
      });
      console.log('✅ Sample tailor created:', tailor.email);
    }

    // Create sample customer
    const existingCustomer = await User.findOne({ role: 'customer' });
    if (!existingCustomer) {
      const customer = await User.create({
        name: 'Jane Customer',
        email: 'customer@example.com',
        password: 'customer123',
        role: 'customer',
        status: 'active',
        isVerified: true,
        customerProfile: {
          age: 28,
          gender: 'female',
          height: 165,
          weight: 60
        }
      });
      console.log('✅ Sample customer created:', customer.email);

      // Create sample orders if we have both tailor and customer
      const tailor = await User.findOne({ role: 'tailor' });
      if (tailor) {
        await Order.create([
          {
            customer: customer._id,
            tailor: tailor._id,
            garmentType: 'kameez',
            kameezStyle: 'anarkali',
            status: 'pending',
            measurements: {
              chest: 36,
              waist: 32,
              hip: 38,
              shoulder: 15,
              sleeveLength: 24
            },
            notes: 'Blue color preferred'
          },
          {
            customer: customer._id,
            tailor: tailor._id,
            garmentType: 'shalwar',
            shalwarStyle: 'simple',
            status: 'completed',
            price: 1500,
            measurements: {
              waist: 32,
              inseam: 30,
              outseam: 42
            }
          }
        ]);
        console.log('✅ Sample orders created');
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('Superadmin: superadmin@tailorsmart.com / admin123');
    console.log('Admin: admin@tailorsmart.com / admin123');
    console.log('Support: support@tailorsmart.com / support123');
    console.log('Tailor: tailor@example.com / tailor123');
    console.log('Customer: customer@example.com / customer123');

  } catch (error) {
    console.error('❌ Seed failed:', error);
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