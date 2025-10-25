import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@shared/schema';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const dbPath = './data/moodai.db';

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(dirname(dbPath), { recursive: true });
  } catch (err) {
    // Directory might already exist, that's fine
  }
}

// Initialize database
await ensureDataDir();
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // Better performance

export const db = drizzle(sqlite, { schema });
