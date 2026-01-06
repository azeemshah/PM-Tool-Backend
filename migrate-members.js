const mongoose = require('mongoose');

const url = 'mongodb://localhost:27017/pm-tool';

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    // Get all workspaces with members
    console.log('\nFinding all workspaces...');
    const workspaces = await db.collection('workspaces').find({}).toArray();
    console.log(`Found ${workspaces.length} workspaces`);

    // Get all existing members
    console.log('\nChecking existing members...');
    const existingMembers = await db.collection('members').find({}).toArray();
    console.log(`Found ${existingMembers.length} members`);
    console.log('Sample member:', JSON.stringify(existingMembers[0], null, 2));

    // For each workspace, create owner member if not exists
    console.log('\nCreating missing owner members...');
    let created = 0;

    for (const workspace of workspaces) {
      const workspaceId = workspace._id;
      const createdBy = workspace.createdBy;

      if (!createdBy) {
        console.log(`  ⚠️  Workspace ${workspaceId} has no createdBy, skipping...`);
        continue;
      }

      // Check if owner member already exists
      const ownerMember = await db.collection('members').findOne({
        userId: createdBy,
        workspaceId: workspaceId,
      });

      if (!ownerMember) {
        // Create owner member
        const result = await db.collection('members').insertOne({
          userId: createdBy,
          workspaceId: workspaceId,
          role: 'Owner',
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        console.log(`  ✅ Created owner member for workspace ${workspaceId}`);
        created++;
      } else {
        console.log(`  ✓️  Owner member already exists for workspace ${workspaceId}`);
      }
    }

    // Sync workspace.members arrays: ensure each workspace.members includes all users that have a member document
    console.log('\nSyncing workspace.members arrays with member documents...');
    let syncedWorkspaces = 0;
    for (const workspace of workspaces) {
      const workspaceId = workspace._id;
      // gather all member userIds for this workspace
      const memberDocs = await db.collection('members').find({ workspaceId }).toArray();
      const userIds = memberDocs
        .map((m) => (m.userId ? m.userId.toString() : null))
        .filter(Boolean);

      // ensure workspace has members array
      const wsDoc = await db.collection('workspaces').findOne({ _id: workspaceId });
      const existingMembers = Array.isArray(wsDoc.members)
        ? wsDoc.members.map((m) => m.toString())
        : [];

      // compute missing userIds
      const missing = userIds.filter((id) => !existingMembers.includes(id));
      if (missing.length > 0) {
        // convert to ObjectIds when updating
        const { ObjectId } = require('mongodb');
        const toPush = missing.map((id) => new ObjectId(id));
        await db
          .collection('workspaces')
          .updateOne({ _id: workspaceId }, { $push: { members: { $each: toPush } } });
        console.log(`  🔁 Synced workspace ${workspaceId}: added ${missing.length} member(s)`);
        syncedWorkspaces++;
      } else {
        console.log(`  ✓ Workspace ${workspaceId} already in sync`);
      }
    }

    console.log(`\n✅ Sync complete. Updated ${syncedWorkspaces} workspace(s).`);

    console.log(`\n✅ Migration complete! Created ${created} owner members.`);
    console.log('\nVerifying all members now...');
    const allMembers = await db.collection('members').find({}).toArray();
    console.log(`Total members after migration: ${allMembers.length}`);
    console.log(
      'Members with roleId:',
      await db.collection('members').countDocuments({ roleId: { $exists: true } }),
    );
    console.log(
      'Members with role:',
      await db.collection('members').countDocuments({ role: { $exists: true } }),
    );

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
