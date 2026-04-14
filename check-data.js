const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pm-tool');
    console.log('Connected to MongoDB');

    const items = await mongoose.connection.db.collection('items').find({}).toArray();
    console.log('Work items count:', items.length);
    if (items.length > 0) {
      console.log('Sample item:', JSON.stringify(items[0], null, 2));
    }

    const workspaces = await mongoose.connection.db.collection('workspaces').find({}).toArray();
    console.log('Workspaces count:', workspaces.length);
    if (workspaces.length > 0) {
      console.log('Sample workspace:', JSON.stringify(workspaces[0], null, 2));
    }

    const columns = await mongoose.connection.db.collection('kanbancolumns').find({}).toArray();
    console.log('Columns count:', columns.length);
    if (columns.length > 0) {
      console.log('Sample column:', JSON.stringify(columns[0], null, 2));
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();