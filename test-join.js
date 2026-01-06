const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/pm_tool').then(async () => {
  const ws = await mongoose.connection.db.collection('workspaces').findOne({});
  if (ws) {
    console.log(`✅ Found workspace: "${ws.name}", inviteCode: "${ws.inviteCode}"`);
    console.log(`Try: http://localhost:5173/invite/workspace/${ws.inviteCode}/join`);
  } else {
    console.log('❌ No workspaces found in database');
  }
  mongoose.connection.close();
}).catch(e => console.error('❌ Error:', e.message));
