const mongoose = require('mongoose');

async function createTestData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pm-tool2');
    console.log('Connected to MongoDB pm-tool2');

    // Create a test user first
    const user = {
      _id: new mongoose.Types.ObjectId(),
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: '$2b$10$hashedpassword', // dummy hash
      profilePicture: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mongoose.connection.db.collection('users').insertOne(user);
    console.log('Test user created');

    // Create a workspace
    const workspace = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Test Workspace',
      description: 'Test workspace for development',
      ownerId: user._id,
      inviteCode: 'TEST123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mongoose.connection.db.collection('workspaces').insertOne(workspace);
    console.log('Test workspace created');

    // Create a member
    const member = {
      userId: user._id,
      workspaceId: workspace._id,
      role: 'Owner',
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await mongoose.connection.db.collection('members').insertOne(member);
    console.log('Test member created');

    // Create test items with different statuses
    const items = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Task in Backlog',
        description: 'This task is in backlog',
        type: 'task',
        status: 'Backlog',
        priority: 'medium',
        workspace: workspace._id,
        assignedTo: user._id,
        reporter: user._id,
        path: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Task in Todo',
        description: 'This task is in todo',
        type: 'task',
        status: 'Todo',
        priority: 'high',
        workspace: workspace._id,
        assignedTo: user._id,
        reporter: user._id,
        path: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Task in Progress',
        description: 'This task is in progress',
        type: 'task',
        status: 'In Progress',
        priority: 'medium',
        workspace: workspace._id,
        assignedTo: user._id,
        reporter: user._id,
        path: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Task in Review',
        description: 'This task is in review',
        type: 'task',
        status: 'Review',
        priority: 'low',
        workspace: workspace._id,
        assignedTo: user._id,
        reporter: user._id,
        path: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Task Done',
        description: 'This task is completed',
        type: 'task',
        status: 'Done',
        priority: 'high',
        workspace: workspace._id,
        assignedTo: user._id,
        reporter: user._id,
        path: 'root',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await mongoose.connection.db.collection('items').insertMany(items);
    console.log('Test items created with different statuses');

    console.log('Test data created successfully!');
    console.log('Workspace ID:', workspace._id.toString());
    console.log('User email: test@example.com');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestData();
