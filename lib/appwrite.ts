// ─────────────────────────────────────────
//  FAT BURN TRACKER — Appwrite Client
// ─────────────────────────────────────────

import { Client, Account, Databases, Storage, ID, Query } from 'appwrite'

// On the server (during build/SSR), use the absolute IP. In the browser, use the proxy path.
const AppwriteEndpoint = typeof window !== "undefined"
  ? (window.location.origin + "/appwrite")
  : (process.env.APPWRITE_ENDPOINT || "http://15.235.146.250:8081/v1");

const client = new Client()
    .setEndpoint(AppwriteEndpoint)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client, ID, Query };

// ── Collection / DB IDs (from env) ───────

export const DB_ID          = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
export const ENTRIES_COL    = process.env.NEXT_PUBLIC_APPWRITE_ENTRIES_COL!
export const PROFILE_COL    = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_COL!
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!
