const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function seed() {
  // Try connecting to both possible DB names used by app: pm-tool and pm_tool
  const uris = ['mongodb://localhost:27017/pm-tool', 'mongodb://localhost:27017/pm_tool'];
  let connectedUri = null;
  for (const uri of uris) {
    try {
      await mongoose.connect(uri);
      connectedUri = uri;
      console.log('Connected to', uri);
      // check if projects collection exists in this DB
      const cols = await mongoose.connection.db.listCollections().toArray();
      const names = cols.map((c) => c.name);
      if (names.includes('projects')) {
        // this DB has projects, use it
        break;
      } else {
        // disconnect and try next URI
        await mongoose.connection.close();
        connectedUri = null;
        continue;
      }
    } catch (e) {
      // try next
      try { await mongoose.connection.close(); } catch (e2) {}
    }
  }
  if (!connectedUri) {
    console.error('No DB with projects collection found on known URIs');
    process.exit(1);
  }
  try {
    const db = mongoose.connection.db;

    // Find a project to attach issues to (prefer Flutter Project)
    let project = await db.collection('projects').findOne({ name: 'Flutter Project' });
    if (!project) project = await db.collection('projects').findOne({});
    if (!project) {
      console.error('No project found to seed issues into.');
      process.exit(1);
    }

    // Find a reporter user (prefer test+1@example.com)
    let user = await db.collection('users').findOne({ email: 'test+1@example.com' });
    if (!user) user = await db.collection('users').findOne({});
    if (!user) {
      console.error('No user found to set as reporter.');
      process.exit(1);
    }

    const projectId = new ObjectId(project._id);
    const reporterId = new ObjectId(user._id);

    const now = new Date();
    const samples = [
      {
        projectId,
        key: `ISS-${Math.floor(Math.random() * 9000) + 1000}`,
        title: 'Seed: Implement authentication flow',
        description: 'Add login/register endpoints and frontend flow',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        reporter: reporterId,
        labels: ['seed', 'auth'],
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        createdAt: now,
        updatedAt: now,
      },
      {
        projectId,
        key: `ISS-${Math.floor(Math.random() * 9000) + 1000}`,
        title: 'Seed: Create project dashboard widgets',
        description: 'Cards for total/overdue/completed tasks',
        type: 'story',
        priority: 'low',
        status: 'backlog',
        reporter: reporterId,
        labels: ['seed', 'dashboard'],
        dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        createdAt: now,
        updatedAt: now,
      },
      {
        projectId,
        key: `ISS-${Math.floor(Math.random() * 9000) + 1000}`,
        title: 'Seed: Fix tasks table empty state bug',
        description: 'Ensure tasks are loaded from issues API correctly',
        type: 'bug',
        priority: 'high',
        status: 'in_progress',
        reporter: reporterId,
        labels: ['seed', 'bug'],
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        createdAt: now,
        updatedAt: now,
      },
    ];

    const resp = await db.collection('issues').insertMany(samples.map(s => ({
      ...s,
      projectId: new ObjectId(s.projectId),
      reporter: new ObjectId(s.reporter),
    })));

    console.log('Inserted issues:', resp.insertedCount);
    console.log('Project id:', project._id);
    mongoose.connection.close();
  } catch (e) {
    console.error('Seed error:', e);
    mongoose.connection.close();
    process.exit(1);
  }
}

seed();
