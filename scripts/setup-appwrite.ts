import { Client, Databases, Storage, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) env[key.trim()] = value.join('=').trim();
});

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT || env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'fitnoob-db';
const ENTRIES_COL = env.NEXT_PUBLIC_APPWRITE_ENTRIES_COL || 'entries';
const PROFILE_COL = env.NEXT_PUBLIC_APPWRITE_PROFILE_COL || 'profile';
const BUCKET_ID = env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || 'progress-photos';

async function setup() {
  console.log('🚀 Starting Appwrite Setup...');

  try {
    // 1. Create Database
    try {
      await databases.create(DB_ID, 'FitNoob Database');
      console.log('✅ Database created:', DB_ID);
    } catch (e: any) {
      if (e.code === 409) console.log('ℹ️ Database already exists');
      else throw e;
    }

    // 2. Create Entries Collection
    try {
      await databases.createCollection(DB_ID, ENTRIES_COL, 'Daily Entries');
      console.log('✅ Collection created:', ENTRIES_COL);

      // Attributes for Entries
      const attrs = [
        { key: 'date', type: 'string', size: 10, required: true },
        { key: 'weight', type: 'double', required: false },
        { key: 'body_fat', type: 'double', required: false },
        { key: 'calories', type: 'integer', required: false },
        { key: 'protein', type: 'integer', required: false },
        { key: 'carbs', type: 'integer', required: false },
        { key: 'fat', type: 'integer', required: false },
        { key: 'walk_km', type: 'double', required: false },
        { key: 'workout_day', type: 'string', size: 50, required: false },
        { key: 'workout_done', type: 'boolean', required: false },
        { key: 'notes', type: 'string', size: 5000, required: false },
        { key: 'user_id', type: 'string', size: 36, required: true },
      ];

      for (const attr of attrs) {
        if (attr.type === 'string') {
          await databases.createStringAttribute(DB_ID, ENTRIES_COL, attr.key, attr.size!, attr.required);
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(DB_ID, ENTRIES_COL, attr.key, attr.required);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(DB_ID, ENTRIES_COL, attr.key, attr.required);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(DB_ID, ENTRIES_COL, attr.key, attr.required);
        }
        console.log(`  🔹 Attribute created: ${attr.key}`);
      }
      
      // Indexes
      // @ts-ignore
      await databases.createIndex(DB_ID, ENTRIES_COL, 'idx_user_date', 'key', ['user_id', 'date'], ['ASC', 'ASC']);
      console.log('  🎯 Index created: user_id + date');

    } catch (e: any) {
      if (e.code === 409) console.log('ℹ️ Entries collection already exists');
      else throw e;
    }

    // 3. Create Profile Collection
    try {
      await databases.createCollection(DB_ID, PROFILE_COL, 'User Profiles');
      console.log('✅ Collection created:', PROFILE_COL);
    } catch (e: any) {
      if (e.code === 409) console.log('ℹ️ Profile collection already exists');
      else throw e;
    }

    const profileAttrs = [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'start_weight', type: 'double', required: true },
      { key: 'goal_weight', type: 'double', required: true },
      { key: 'start_date', type: 'string', size: 10, required: true },
      
      { key: 'age', type: 'integer', required: true },
      { key: 'sex', type: 'string', size: 10, required: true },
      { key: 'height', type: 'double', required: true },
      { key: 'activity_level', type: 'string', size: 20, required: true },
      { key: 'goal', type: 'string', size: 20, required: true },

      { key: 'target_calories', type: 'integer', required: true },
      { key: 'target_protein', type: 'integer', required: true },
      { key: 'target_carbs', type: 'integer', required: true },
      { key: 'target_fat', type: 'integer', required: true },
      { key: 'onboarding_done', type: 'boolean', required: true },
    ];

    for (const attr of profileAttrs) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(DB_ID, PROFILE_COL, attr.key, attr.size!, attr.required);
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(DB_ID, PROFILE_COL, attr.key, attr.required);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(DB_ID, PROFILE_COL, attr.key, attr.required);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(DB_ID, PROFILE_COL, attr.key, attr.required);
        }
        console.log(`  🔹 Attribute created: ${attr.key}`);
      } catch (e: any) {
        if (e.code === 409) console.log(`  ℹ️ Attribute ${attr.key} already exists`);
        else throw e;
      }
    }

    try {
      // @ts-ignore
      await databases.createIndex(DB_ID, PROFILE_COL, 'idx_user', 'unique', ['user_id'], ['ASC']);
      console.log('  🎯 Unique Index created: user_id');
    } catch (e: any) {
      if (e.code === 409) console.log('  ℹ️ Index idx_user already exists');
      else throw e;
    }

    // 4. Create Bucket
    try {
      await storage.createBucket(BUCKET_ID, 'Progress Photos', ['read("users")', 'write("users")'], false);
      console.log('✅ Bucket created:', BUCKET_ID);
    } catch (e: any) {
      if (e.code === 409) console.log('ℹ️ Bucket already exists');
      else throw e;
    }

    console.log('\n🌟 Setup Complete! You can now use FitNoob.');

  } catch (error: any) {
    console.error('\n❌ Setup Failed:', error.message);
    process.exit(1);
  }
}

setup();
