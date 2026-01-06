const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/pm-tool').then(async () => {
  try {
    // Get members with their user details
    const members = await mongoose.connection.db.collection('members').aggregate([
      { $match: {} },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $limit: 1 }
    ]).toArray();
    
    console.log('Members with aggregation:');
    console.log(JSON.stringify(members, null, 2));
    
    mongoose.connection.close();
  } catch (e) {
    console.error('Error:', e.message);
    mongoose.connection.close();
  }
}).catch(e => console.error('Connection error:', e));
