/**
 * Manual cleanup for duplicate issue keys
 * Run this once to clean up duplicates from the old non-atomic key generation
 *
 * Usage: npm run cleanup:duplicates
 */

const { MongoClient } = require('mongodb');
const url =
  process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/pm-tool?authSource=admin';

async function cleanupDuplicates() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('pm-tool');
    const issuesCollection = db.collection('issues');

    // Find all duplicate keys
    const aggregation = [
      {
        $group: {
          _id: '$key',
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ];

    const duplicates = await issuesCollection.aggregate(aggregation).toArray();

    if (duplicates.length === 0) {
      console.log('✅ No duplicates found - database is clean!');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} key(s) with duplicates:\n`);

    let totalDeleted = 0;

    for (const dup of duplicates) {
      const key = dup._id;
      const count = dup.count;
      const toKeep = dup.docs[0]; // Keep the first one
      const toDelete = dup.docs.slice(1); // Delete the rest

      console.log(`  Key "${key}": ${count} total, deleting ${toDelete.length}`);

      const deleteIds = toDelete.map((d) => d._id);
      const result = await issuesCollection.deleteMany({ _id: { $in: deleteIds } });
      totalDeleted += result.deletedCount;
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate documents.`);
    console.log('\n💡 The atomic counter system is now in place.');
    console.log('   Future issue keys will be guaranteed unique!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupDuplicates();
