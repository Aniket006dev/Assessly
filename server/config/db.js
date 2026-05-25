const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Force IPv4 by using 127.0.0.1 instead of localhost
    const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assessly')
      .replace('mongodb://localhost', 'mongodb://127.0.0.1');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,   // fail fast if MongoDB not running
      family: 4,                         // force IPv4
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}:${conn.connection.port}`);
  } catch (err) {
    console.error('');
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('');
    console.error('   Make sure MongoDB is running:');
    console.error('   Windows:  net start MongoDB');
    console.error('             OR start "C:\\Program Files\\MongoDB\\Server\\<version>\\bin\\mongod.exe"');
    console.error('   Or use a free Atlas cluster: https://cloud.mongodb.com');
    console.error('   Then set MONGODB_URI=mongodb+srv://... in server/.env');
    console.error('');
    process.exit(1);
  }
};

module.exports = connectDB;
