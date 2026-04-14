const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pm-tool2');
    console.log('Connected to MongoDB pm-tool2');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    const items = await mongoose.connection.db.collection('items').find({}).limit(10).toArray();
    console.log('Work items count:', items.length);

    const workspaces = await mongoose.connection.db.collection('workspaces').find({}).limit(10).toArray();
    console.log('Workspaces count:', workspaces.length);

    const users = await mongoose.connection.db.collection('users').find({}).limit(10).toArray();
    console.log('Users count:', users.length);

    if (items.length > 0) {
      console.log('Sample items:');
      items.forEach((item, i) => {
        console.log(`Item ${i+1}: title="${item.title}", status="${item.status}"`);
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();