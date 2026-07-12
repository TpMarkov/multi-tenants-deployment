import mongoose from 'mongoose';
import ensureDemoData from './ensureDemoData.js';

const connectDB = async () => {
  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await ensureDemoData();
    } catch (error) {
      console.error(`MongoDB connection error (retrying in 10s): ${error.message}`);
      setTimeout(connectWithRetry, 10000);
    }
  };

  connectWithRetry();
};

export default connectDB;
