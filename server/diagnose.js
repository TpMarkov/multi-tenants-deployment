import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/modules/users/user.model.js';
import Property from './src/modules/properties/property.model.js';

dotenv.config();

const TEST_EMAIL = 'admin2@hotel.com';
const TEST_PASSWORD = 'password123';

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!\n');

    const propertyCount = await Property.countDocuments();
    const userCount = await User.countDocuments();

    console.log(`Properties count: ${propertyCount}`);
    console.log(`Users count: ${userCount}\n`);

    const users = await User.find({});
    console.log('--- USERS ---');
    for (const u of users) {
      const hasPassword = Boolean(u.password);
      console.log(JSON.stringify({
        email: u.email,
        role: u.role,
        hasPassword,
        propertyId: u.propertyId ? u.propertyId.toString() : null
      }));
    }
    console.log('-------------');

    const user = await User.findOne({ email: TEST_EMAIL }).select('+password');
    if (!user) {
      console.log(`\n[LOGIN DIAGNOSTIC] No user found with email: ${TEST_EMAIL}`);
      process.exit(0);
    }

    const match = await bcrypt.compare(TEST_PASSWORD, user.password);
    console.log(`\n[LOGIN DIAGNOSTIC] Email: ${TEST_EMAIL}`);
    console.log(`[LOGIN DIAGNOSTIC] Provided password match: ${match}`);
    process.exit(0);
  } catch (error) {
    console.error('Diagnostic error:', error);
    process.exit(1);
  }
};

run();
