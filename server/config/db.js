const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    // Check if we're in demo mode (no MongoDB needed)
    if (process.env.DEMO_MODE === 'true') {
      console.log('Running in demo mode - No MongoDB connection required');
      return;
    }
    
    try {
      // Start an in-memory MongoDB server
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      // Connect to in-memory database
      const conn = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      console.log(`MongoDB In-Memory Server Connected: ${conn.connection.host}`);
      console.log(`MongoDB In-Memory URI: ${uri}`);
      
      // Seed database with initial data if needed
      // await seedDatabase();
      
    } catch (dbError) {
      console.error(`MongoDB connection error: ${dbError.message}`);
      console.log('Falling back to demo mode - API will return mock data');
      process.env.DEMO_MODE = 'true';
    }
  } catch (error) {
    console.error(`Error during DB connection setup: ${error.message}`);
    console.log('Falling back to demo mode - API will return mock data');
    process.env.DEMO_MODE = 'true';
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
};

module.exports = { connectDB, disconnectDB };
