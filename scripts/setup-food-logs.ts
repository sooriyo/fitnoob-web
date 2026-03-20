import { Client, Databases, Permission, Role } from 'node-appwrite';
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

const DB_ID = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'fitnoob-db';
const FOOD_LOGS_COL = 'food_logs';

async function setupFoodLogs() {
  console.log('🚀 Setting up Food Logs collection...');

  const collPermissions = [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
    Permission.update(Role.users()),
    Permission.delete(Role.users()),
  ];

  try {
    // 1. Create Collection
    try {
      await databases.createCollection(DB_ID, FOOD_LOGS_COL, 'Food Logs', collPermissions);
      console.log('✅ Collection created:', FOOD_LOGS_COL);
    } catch (e: any) {
      if (e.code === 409) console.log('ℹ️ Food Logs collection already exists');
      else throw e;
    }

    // 2. Add Attributes
    const attrs = [
      { key: 'user_id', type: 'string', size: 36, required: true },
      { key: 'date', type: 'string', size: 10, required: true },
      { key: 'food_name', type: 'string', size: 255, required: true },
      { key: 'calories', type: 'integer', required: true },
      { key: 'protein', type: 'double', required: true },
      { key: 'carbs', type: 'double', required: true },
      { key: 'fat', type: 'double', required: true },
      { key: 'grams', type: 'integer', required: true },
    ];

    for (const attr of attrs) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(DB_ID, FOOD_LOGS_COL, attr.key, attr.size!, attr.required);
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(DB_ID, FOOD_LOGS_COL, attr.key, attr.required);
        } else if (attr.type === 'double') {
          await databases.createFloatAttribute(DB_ID, FOOD_LOGS_COL, attr.key, attr.required);
        }
        console.log(`  🔹 Attribute created: ${attr.key}`);
      } catch (e: any) {
        if (e.code === 409) console.log(`  ℹ️ Attribute ${attr.key} already exists`);
        else throw e;
      }
    }

    // 3. Index
    try {
      // @ts-ignore
      await databases.createIndex(DB_ID, FOOD_LOGS_COL, 'idx_user_date', 'key', ['user_id', 'date'], ['ASC', 'ASC']);
      console.log('  🎯 Index created: user_id + date');
    } catch (e: any) {
      if (e.code === 409) console.log('  ℹ️ Index already exists');
    }

    console.log('\n🌟 Food Logs collection is ready.');
  } catch (err: any) {
    console.error('❌ Setup failed:', err.message);
  }
}

setupFoodLogs();
