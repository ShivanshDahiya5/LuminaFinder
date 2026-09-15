import { neon } from '@neondatabase/serverless';

let sql = null;

/**
 * Returns a Neon SQL tagged-template client.
 * Requires the DATABASE_URL environment variable to be set.
 */
export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is not set.\n' +
        'Create a free Neon database at https://neon.tech and set DATABASE_URL in your .env or Vercel project settings.'
      );
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

/**
 * Initialises the database schema (idempotent — safe to call on every cold start).
 */
export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      username      TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      media_id    TEXT NOT NULL,
      type        TEXT NOT NULL,
      title       TEXT NOT NULL,
      subtitle    TEXT,
      image       TEXT,
      rating      REAL,
      genres      TEXT,
      description TEXT,
      added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, media_id, type)
    )
  `;
}
