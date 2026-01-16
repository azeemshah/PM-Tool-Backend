const mongoose = require('mongoose');

async function updateStatus() {
  try {
    await mongoose.connect('mongodb://localhost:27017/pm-tool');
    console.log('Connected to MongoDB');

    // Update items with status "in progress" to "In Progress"
    const result = await mongoose.connection.db.collection('items').updateMany(
      { status: 'in progress' },
      { $set: { status: 'In Progress' } }
    );

    console.log(`Updated ${result.modifiedCount} items from "in progress" to "In Progress"`);

    // Update items with status "in review" to "In Review"
    const result2 = await mongoose.connection.db.collection('items').updateMany(
      { status: 'in review' },
      { $set: { status: 'In Review' } }
    );

    console.log(`Updated ${result2.modifiedCount} items from "in review" to "In Review"`);

    // Update items with status "todo" to "Todo"
    const result3 = await mongoose.connection.db.collection('items').updateMany(
      { status: 'todo' },
      { $set: { status: 'Todo' } }
    );

    console.log(`Updated ${result3.modifiedCount} items from "todo" to "Todo"`);

    // Update items with status "done" to "Done"
    const result4 = await mongoose.connection.db.collection('items').updateMany(
      { status: 'done' },
      { $set: { status: 'Done' } }
    );

    console.log(`Updated ${result4.modifiedCount} items from "done" to "Done"`);

    // Update items with status "backlog" to "Backlog"
    const result5 = await mongoose.connection.db.collection('items').updateMany(
      { status: 'backlog' },
      { $set: { status: 'Backlog' } }
    );

    console.log(`Updated ${result5.modifiedCount} items from "backlog" to "Backlog"`);

    // Check all items after update
    const items = await mongoose.connection.db.collection('items').find({}).toArray();
    console.log('All items after update:');
    items.forEach(item => {
      console.log(`- ${item.title}: ${item.status}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateStatus();