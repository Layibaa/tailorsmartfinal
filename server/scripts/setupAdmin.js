// ====================
// server/scripts/setupAdmin.js
// ====================
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Order = require('../models/Order');
require('dotenv').config();

const setupAdminAndSampleData = async () => {
  try {
    console.log('🚀 Starting admin setup and sample data creation...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tailorsmart');
    console.log('✅ Connected to MongoDB');

    // 1. Create Admin Users
    console.log('\n📝 Creating admin users...');
    
    // Check if super admin already exists
    let superAdmin = await Admin.findOne({ email: 'admin@tailorsmart.com' });
    
    if (!superAdmin) {
      superAdmin = await Admin.create({
        name: 'Super Admin',
        email: 'admin@tailorsmart.com',
        password: 'admin123',
        role: 'superadmin'
      });
      console.log('✅ Super Admin created:', superAdmin.email);
    } else {
      console.log('ℹ️ Super Admin already exists:', superAdmin.email);
    }

    // Create regular admin
    let regularAdmin = await Admin.findOne({ email: 'moderator@tailorsmart.com' });
    
    if (!regularAdmin) {
      regularAdmin = await Admin.create({
        name: 'Moderator',
        email: 'moderator@tailorsmart.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Regular Admin created:', regularAdmin.email);
    } else {
      console.log('ℹ️ Regular Admin already exists:', regularAdmin.email);
    }

    // 2. Create Sample Customers
    console.log('\n👥 Creating sample customers...');
    
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'customer',
        isVerified: true,
        customerProfile: {
          age: 30,
          gender: 'male',
          weight: 75,
          height: 180,
          savedMeasurements: {
            chest: 42,
            waist: 32,
            hip: 38,
            shoulder: 18,
            sleeveLength: 25
          }
        }
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        role: 'customer',
        isVerified: true,
        customerProfile: {
          age: 28,
          gender: 'female',
          weight: 60,
          height: 165,
          savedMeasurements: {
            chest: 36,
            waist: 28,
            hip: 38,
            shoulder: 16,
            sleeveLength: 22
          }
        }
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: 'password123',
        role: 'customer',
        isVerified: true,
        customerProfile: {
          age: 35,
          gender: 'male',
          weight: 80,
          height: 175,
          savedMeasurements: {
            chest: 44,
            waist: 34,
            hip: 40,
            shoulder: 19,
            sleeveLength: 26
          }
        }
      }
    ];

    const customers = [];
    for (const customerData of sampleCustomers) {
      let customer = await User.findOne({ email: customerData.email });
      if (!customer) {
        customer = await User.create(customerData);
        console.log('✅ Customer created:', customer.name);
      }
      customers.push(customer);
    }

    // 3. Create Sample Tailors
    console.log('\n✂️ Creating sample tailors...');
    
    const sampleTailors = [
      {
        name: 'Master Tailor Ali',
        email: 'ali.tailor@example.com',
        password: 'password123',
        role: 'tailor',
        isVerified: true,
        tailorProfile: {
          shopName: 'Ali\'s Premium Tailoring',
          shopLocation: 'Saddar, Rawalpindi',
          experience: 15,
          specialties: ['suits', 'formal wear', 'alterations'],
          averagePrice: 2500,
          rating: 4.8
        }
      },
      {
        name: 'Fatima Designer',
        email: 'fatima.designer@example.com',
        password: 'password123',
        role: 'tailor',
        isVerified: true,
        tailorProfile: {
          shopName: 'Fatima\'s Fashion House',
          shopLocation: 'Commercial Market, Rawalpindi',
          experience: 12,
          specialties: ['dresses', 'casual wear', 'women clothing'],
          averagePrice: 2000,
          rating: 4.6
        }
      },
      {
        name: 'Ahmed Craftsman',
        email: 'ahmed.craft@example.com',
        password: 'password123',
        role: 'tailor',
        isVerified: true,
        tailorProfile: {
          shopName: 'Ahmed\'s Craft Corner',
          shopLocation: 'Raja Bazaar, Rawalpindi',
          experience: 20,
          specialties: ['traditional wear', 'kurtas', 'shalwar kameez'],
          averagePrice: 1800,
          rating: 4.9
        }
      }
    ];

    const tailors = [];
    for (const tailorData of sampleTailors) {
      let tailor = await User.findOne({ email: tailorData.email });
      if (!tailor) {
        tailor = await User.create(tailorData);
        console.log('✅ Tailor created:', tailor.name);
      }
      tailors.push(tailor);
    }

    // 4. Create Sample Orders
    console.log('\n📦 Creating sample orders...');
    
    const orderStatuses = ['pending', 'accepted', 'confirmed', 'making', 'payment_done', 'completed', 'rejected'];
    const garmentTypes = ['shalwar', 'kameez'];
    
    for (let i = 0; i < 25; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const tailor = tailors[Math.floor(Math.random() * tailors.length)];
      const garmentType = garmentTypes[Math.floor(Math.random() * garmentTypes.length)];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Create order date between now and 60 days ago
      const createdAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
      
      const orderData = {
        customer: customer._id,
        tailor: tailor._id,
        garmentType,
        status,
        measurements: {
          chest: 40 + Math.random() * 8,
          waist: 30 + Math.random() * 6,
          hip: 36 + Math.random() * 8,
          shoulder: 16 + Math.random() * 4,
          sleeveLength: 22 + Math.random() * 6
        },
        notes: `Custom ${garmentType} with specific requirements`,
        price: status !== 'pending' && status !== 'rejected' ? 1500 + Math.random() * 2000 : null,
        createdAt
      };

      // Only create if similar order doesn't exist
      const existingOrder = await Order.findOne({
        customer: customer._id,
        tailor: tailor._id,
        garmentType,
        createdAt: { $gte: new Date(createdAt.getTime() - 1000), $lte: new Date(createdAt.getTime() + 1000) }
      });

      if (!existingOrder) {
        await Order.create(orderData);
      }
    }

    console.log('✅ Sample orders created');

    // 5. Display Setup Summary
    console.log('\n📊 Setup Summary:');
    console.log('==================');
    
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalTailors = await User.countDocuments({ role: 'tailor' });
    const totalOrders = await Order.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    
    console.log(`👥 Total Customers: ${totalCustomers}`);
    console.log(`✂️ Total Tailors: ${totalTailors}`);
    console.log(`📦 Total Orders: ${totalOrders}`);
    console.log(`👑 Total Admins: ${totalAdmins}`);
    
    // Display order status breakdown
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📈 Orders by Status:');
    ordersByStatus.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });
    
    console.log('\n🔑 Admin Credentials:');
    console.log('=====================');
    console.log('Super Admin:');
    console.log('  Email: admin@tailorsmart.com');
    console.log('  Password: admin123');
    console.log('  Role: superadmin');
    console.log('');
    console.log('Regular Admin:');
    console.log('  Email: moderator@tailorsmart.com');
    console.log('  Password: admin123');
    console.log('  Role: admin');
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('You can now start the server and access the admin panel.');

  } catch (error) {
    console.error('❌ Error during setup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupAdminAndSampleData();
}

module.exports = setupAdminAndSampleData;