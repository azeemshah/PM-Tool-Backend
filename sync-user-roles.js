const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pm-tool';

// Define schemas
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String,
});

const memberSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  workspaceId: mongoose.Schema.Types.ObjectId,
  role: String,
  joinedAt: Date,
});

async function syncUserRoles() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User', userSchema);
    const Member = mongoose.model('Member', memberSchema);

    // Find all members with "Owner" role
    const owners = await Member.find({ role: 'Owner' }).populate('userId');
    console.log(`\n📊 Found ${owners.length} workspace owners`);

    if (owners.length === 0) {
      console.log('No owners found to sync');
      return;
    }

    let updated = 0;
    for (const member of owners) {
      if (!member.userId) {
        console.warn(`⚠️ Member ${member._id} has no userId`);
        continue;
      }

      const user = await User.findById(member.userId._id);
      if (!user) {
        console.warn(`⚠️ User ${member.userId._id} not found`);
        continue;
      }

      // Update user role if it's not already "admin"
      if (user.role !== 'admin') {
        const oldRole = user.role;
        user.role = 'admin';
        await user.save();
        console.log(
          `✅ Updated ${user.firstName} ${user.lastName} (${user.email}): ${oldRole} -> admin`,
        );
        updated++;
      } else {
        console.log(`ℹ️ ${user.firstName} ${user.lastName} already has admin role`);
      }
    }

    console.log(`\n✨ Sync complete! Updated ${updated} users`);
  } catch (error) {
    console.error('❌ Error syncing roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

syncUserRoles();
