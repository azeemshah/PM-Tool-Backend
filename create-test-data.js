const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

mongoose
  .connect('mongodb://localhost:27017/pm-tool')
  .then(async () => {
    try {
      // Get the user
      const user = await mongoose.connection.db.collection('users').findOne({});
      const userId = new ObjectId(user._id);

      // Create a workspace
      const workspace = {
        name: 'Development',
        description: 'Development workspace',
        ownerId: userId,
        inviteCode: 'DEV' + Date.now().toString().slice(-6),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const wsResult = await mongoose.connection.db.collection('workspaces').insertOne(workspace);
      const workspaceId = wsResult.insertedId;

      console.log('Workspace created:', workspaceId);
      console.log('User:', user.firstName, user.lastName, `(${user.email})`);

      // Add the user as Owner member
      const member = {
        userId: userId,
        workspaceId: workspaceId,
        role: 'Owner',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const memberResult = await mongoose.connection.db.collection('members').insertOne(member);
      console.log('Member added:', memberResult.insertedId);

      // Verify
      const members = await mongoose.connection.db
        .collection('members')
        .find({ workspaceId })
        .toArray();
      console.log('Members count:', members.length);
      console.log('\nNow try accessing the workspace with members to see them displayed!');

      mongoose.connection.close();
    } catch (e) {
      console.error('Error:', e.message);
      mongoose.connection.close();
    }
  })
  .catch((e) => console.error('Connection error:', e));
