/**
 * One-time admin setup script.
 * Usage: node scripts/setAdmin.js
 *
 * This sets the user with the given email to role='admin' in MongoDB.
 */

import '../loadEnv.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL = 'rajatava2006@gmail.com';

async function setAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/K-Forum');
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email: ADMIN_EMAIL });

    if (!user) {
      console.error(`❌ No user found with email: ${ADMIN_EMAIL}`);
      console.log('Make sure the user has registered/logged in first.');
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`ℹ️  User "${user.name}" (${user.email}) is already an admin.`);
    } else {
      user.role = 'admin';
      await user.save();
      console.log(`✅ Successfully set "${user.name}" (${user.email}) as admin!`);
    }

    console.log('\nUser details:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  ID:', user._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdmin();
