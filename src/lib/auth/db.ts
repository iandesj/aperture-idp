import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

const isTest = process.env.NODE_ENV === 'test';

const databasePath = isTest
  ? ':memory:'
  : process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'users.db');

if (!isTest) {
  const dir = path.dirname(databasePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

const db = new Database(databasePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Token blacklist table is created in token-blacklist.ts

export default db;

