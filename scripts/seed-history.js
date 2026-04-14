// Simple seed script to insert sample activity logs for manual testing
const mongoose = require('mongoose');
require('dotenv').config();

const ActivitySchema = new mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  projectId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  type: String,
  details: Object,
  from: String,
  to: String,
  timeSpentSeconds: Number,
  metadata: Object,
  createdAt: { type: Date, default: Date.now },
});

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pm-tool';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const Activity = mongoose.model('Activity', ActivitySchema);

  const now = new Date();
  const items = [
    {
      userId: new mongoose.Types.ObjectId(),
      type: 'create',
      details: { title: 'Epic' },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      userId: new mongoose.Types.ObjectId(),
      type: 'status_change',
      from: 'To Do',
      to: 'In Progress',
      details: { title: 'Storyr' },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      userId: new mongoose.Types.ObjectId(),
      type: 'status_change',
      from: 'In Progress',
      to: 'In Review',
      details: { title: 'Create Bug' },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    },
    {
      userId: new mongoose.Types.ObjectId(),
      type: 'time_logged',
      timeSpentSeconds: 3600,
      details: { title: 'Logon', description: 'Worked on login' },
      createdAt: now,
    },
  ];

  await Activity.insertMany(items);
  console.log('Inserted sample activity items');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
