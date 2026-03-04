const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://hetjani818_db_user:123@cluster0.gvgl3yk.mongodb.net/myapp?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

