const { MongoClient } = require('mongodb');

const mongoUri = 'mongodb://admin:admin123@localhost:27017/pm-tool?authSource=admin';

async function cleanup() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('pm-tool');

    console.log('🔍 Searching for duplicate issue keys...\n');

    // Get all issues with duplicate keys
    const duplicates = await db
      .collection('issues')
      .aggregate([
        { $group: { _id: '$key', count: { $sum: 1 }, ids: { $push: '$_id' } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length === 0) {
      console.log('✅ No duplicate keys found!');
      return;
    }

    console.log(`❌ Found ${duplicates.length} duplicate key(s):\n`);
    duplicates.forEach((d) => {
      console.log(`   Key: ${d._id}, Count: ${d.count} documents`);
    });

    console.log('\n🗑️  Removing duplicates (keeping first, deleting rest)...\n');

    // Keep first, delete rest for each duplicate key
    for (const dup of duplicates) {
      const [keep, ...toDelete] = dup.ids;
      if (toDelete.length > 0) {
        const result = await db.collection('issues').deleteMany({ _id: { $in: toDelete } });
        console.log(`   ✓ Deleted ${result.deletedCount} duplicate(s) for key "${dup._id}"`);
      }
    }

    console.log('\n✅ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

cleanup();
