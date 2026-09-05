import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database.js';
import mongoose from 'mongoose';

async function migrate() {
  await connectDatabase();
  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // 1. Update tanveermuzammil03@gmail.com explicitly
  const tanveerResult = await usersCollection.updateOne(
    { email: 'tanveermuzammil03@gmail.com' },
    {
      $set: {
        role: 'owner',
        isEmailVerified: true,
        isVerified: true,
        status: 'active'
      }
    }
  );
  console.log('tanveer user updated:', tanveerResult.modifiedCount);

  // 2. Normalize all legacy roles
  await usersCollection.updateMany(
    { role: 'admin' },
    { $set: { role: 'owner', isEmailVerified: true } }
  );
  await usersCollection.updateMany(
    { role: { $in: ['buyer', 'vendor', 'member'] } },
    { $set: { role: 'editor', isEmailVerified: true } }
  );
  await usersCollection.updateMany(
    { isEmailVerified: { $ne: true } },
    { $set: { isEmailVerified: true } }
  );

  const allUsers = await usersCollection.find({}).project({ email: 1, role: 1, isEmailVerified: 1 }).toArray();
  console.log('Migration complete. Current users state:');
  allUsers.forEach(u => console.log(` - ${u.email}: role=${u.role}, verified=${u.isEmailVerified}`));
  process.exit(0);
}

migrate();
