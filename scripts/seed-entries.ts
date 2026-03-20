import { Client, Databases, ID } from 'node-appwrite';
import fs from 'fs';
import path from 'path';
import { SEED_ENTRIES } from '../lib/seedData';

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
const ENTRIES_COL = env.NEXT_PUBLIC_APPWRITE_ENTRIES_COL || 'entries';

const USER_ID = '69bce322001ba2da0d0f';

async function seed() {
  console.log(`🚀 Seeding ${SEED_ENTRIES.length} entries for user: ${USER_ID}`);

  for (const entry of SEED_ENTRIES) {
    try {
      await databases.createDocument(
        DB_ID,
        ENTRIES_COL,
        ID.unique(),
        {
          ...entry,
          user_id: USER_ID
        }
      );
      console.log(`✅ Seeded: ${entry.date}`);
    } catch (e: any) {
      console.error(`❌ Failed ${entry.date}:`, e.message);
    }
  }

  console.log('\n🌟 Seeding Complete!');
}

seed();
