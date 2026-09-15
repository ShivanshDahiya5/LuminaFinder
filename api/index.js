/**
 * Vercel Serverless Function entry point.
 * All /api/* requests are routed here by vercel.json.
 *
 * On every cold start, the database schema is initialised (idempotent).
 */
import app from '../server/app.js';
import { initDb } from '../server/db.js';

// Run schema init on cold start; don't block the handler export
initDb().catch(err => console.error('DB init error:', err));

export default app;
