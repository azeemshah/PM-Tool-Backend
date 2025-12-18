const { MongoClient } = require("mongodb");
const bcrypt = require('bcrypt');
require("dotenv").config(); // load .env

const MONGODB_URI = process.env.DATABASE_URL
const ADMIN_FIRST_NAME = process.env.DEFAULT_ADMIN_FIRST_NAME;
const ADMIN_LAST_NAME = process.env.DEFAULT_ADMIN_LAST_NAME;
const ADMIN_CONTACT_NUMBER = process.env.DEFAULT_ADMIN_CONTACT_NUMBER || null;
const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function seedAdmin() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log(`Admin user (${ADMIN_EMAIL}) already exists. Skipping...`);
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

    await users.insertOne({
      first_name: ADMIN_FIRST_NAME,
      last_name: ADMIN_LAST_NAME,
      email: ADMIN_EMAIL,
      contact_number: ADMIN_CONTACT_NUMBER,
      password: hashedPassword,
      user_type: 'admin',
      roles: [],
      organizations: [],
      is_active: true,
    });

    console.log(`Admin user (${ADMIN_EMAIL}) seeded successfully!`);
  } catch (err) {
    console.error("Error seeding admin user:", err);
  } finally {
    await client.close();
  }
}

seedAdmin();