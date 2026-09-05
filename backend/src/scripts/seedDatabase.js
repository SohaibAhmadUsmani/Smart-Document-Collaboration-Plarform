import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database.js';
import { User } from '../modules/auth/user.model.js';
import { Workspace } from '../modules/workspaces/models/Workspace.js';
import { WorkspaceMember } from '../modules/workspaces/models/WorkspaceMember.js';
import { DocumentModel } from '../modules/documents/document.model.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[Seed]: Connecting to database...');
  await connectDatabase();

  const saltRounds = 10;
  const devPasswordHash = await bcrypt.hash('dev-password-test', saltRounds);

  // Ensure primary developer account exists
  let devUser = await User.findOne({ email: 'tanveermuzammil03@gmail.com' });
  if (!devUser) {
    devUser = await User.create({
      name: 'Muzammil Tanveer',
      email: 'tanveermuzammil03@gmail.com',
      password: devPasswordHash,
      role: 'owner',
      isEmailVerified: true,
    });
    console.log('[Seed]: Created developer user tanveermuzammil03@gmail.com');
  } else {
    devUser.role = 'owner';
    devUser.isEmailVerified = true;
    await devUser.save();
    console.log('[Seed]: Verified and updated developer user tanveermuzammil03@gmail.com');
  }

  // Ensure default workspace exists
  let defaultWs = await Workspace.findOne({ owner: devUser._id });
  if (!defaultWs) {
    defaultWs = await Workspace.create({
      name: 'My Workspace',
      description: 'Default primary workspace for document collaboration',
      owner: devUser._id,
    });
    console.log('[Seed]: Created default workspace for developer');
  }

  await WorkspaceMember.findOneAndUpdate(
    { workspace: defaultWs._id, user: devUser._id },
    { role: 'OWNER' },
    { upsert: true, new: true }
  );

  console.log('[Seed]: Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
