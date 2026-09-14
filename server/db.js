import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPromise = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
      });

      // Enable foreign keys
      await db.run('PRAGMA foreign_keys = ON');

     // Create users table
      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

