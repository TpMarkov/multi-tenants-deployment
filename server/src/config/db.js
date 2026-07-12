import mongoose from 'mongoose';
import ensureDemoData from './ensureDemoData.js';

const connectDB = async () => {
  const connectWithRetry = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        console.error("MONGODB_URI is not defined in environment variables");
        return;
      }
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB connection error (retrying in 10s): ${error.message}`);
      setTimeout(connectWithRetry, 10000);
      return;
    }

    try {
      await ensureDemoData();
    } catch (error) {
      console.error(`Demo data provisioning error: ${error.message}`);
    }
  };

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB reconnected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log(`MongoDB reconnected: ${mongoose.connection.host}`);
  });

  connectWithRetry();
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected gracefully');
  } catch (error) {
    console.error(`MongoDB disconnection error: ${error.message}`);
    throw error;
  }
};

export default connectDB;
export { disconnectDB };
