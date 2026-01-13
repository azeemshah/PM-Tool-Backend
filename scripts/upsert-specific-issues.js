const mongoose = require('mongoose');
const { Types } = mongoose;

const tryUris = [
  'mongodb://localhost:27017/pm-tool',
  'mongodb://localhost:27017/pm_tool',
  'mongodb://127.0.0.1:27017/pm-tool',
  'mongodb://127.0.0.1:27017/pm_tool',
];

const issues = [
  {
    _id: '696129953e31777b7e9621d4',
    projectId: '695f7be6922da8de75fc9cf1',
    key: 'ISS-25',
    title: 'Jira Task Test with epic',
    description: 'Create a Jira Task With Epic',
    type: 'task',
    epicId: '695f90dee1475c0281f9d33c',
    priority: 'medium',
    status: 'backlog',
    reporter: '695e10e1de45e42e5a8189df',
    labels: [],
    attachments: [],
  },
  {
    _id: '696129c13e31777b7e9621db',
    projectId: '695f7be6922da8de75fc9cf1',
    key: 'ISS-26',
    title: 'Create a Jira Task Without Epic',
    description: 'Create a jira Task Without Epuc',
    type: 'task',
    priority: 'medium',
    status: 'backlog',
    reporter: '695e10e1de45e42e5a8189df',
    labels: [],
    attachments: [],
  },
  {
    _id: '69612c7c3e31777b7e962243',
    projectId: '695e104dde45e42e5a818968',
    key: 'ISS-30',
    title: 'Create Task F',
    description: 'Create a Task Flutter App',
    type: 'task',
    priority: 'medium',
    status: 'todo',
    reporter: '695e10e1de45e42e5a8189df',
    dueDate: new Date('2026-01-28T19:00:00.000Z'),
    labels: [],
    attachments: [],
  },
  {
    _id: '69612cb23e31777b7e962252',
    projectId: '695f7be6922da8de75fc9cf1',
    key: 'ISS-27',
    title: 'Jira Task',
    description: 'Create a Jira Task',
    type: 'task',
    priority: 'high',
    status: 'backlog',
    reporter: '695e10e1de45e42e5a8189df',
    dueDate: new Date('2026-01-28T19:00:00.000Z'),
    labels: [],
    attachments: [],
  },
];

async function upsert(uri) {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to', uri);

    const col = mongoose.connection.collection('issues');

    for (const doc of issues) {
      const id = new Types.ObjectId(doc._id);
      const projectId = new Types.ObjectId(doc.projectId);
      const payload = { ...doc };
      payload._id = id;
      payload.projectId = projectId;
      // convert reporter to ObjectId if present
      if (payload.reporter) payload.reporter = new Types.ObjectId(payload.reporter);
      // ensure dates
      if (payload.dueDate && !(payload.dueDate instanceof Date))
        payload.dueDate = new Date(payload.dueDate);

      const res = await col.updateOne({ _id: id }, { $set: payload }, { upsert: true });
      console.log('Upserted', doc.key, 'result:', res.result || res);
    }

    await mongoose.disconnect();
    return true;
  } catch (e) {
    console.error('Failed to upsert to', uri, e.message || e);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    return false;
  }
}

(async () => {
  for (const uri of tryUris) {
    const ok = await upsert(uri);
    if (ok) {
      console.log('Done.');
      process.exit(0);
    }
  }
  console.error(
    'All URIs failed. Please check MongoDB is running and update the script with the correct connection string.',
  );
  process.exit(1);
})();
