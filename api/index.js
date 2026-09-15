/**
 * Vercel Serverless Function entry point.
 * All /api/* requests are routed here by vercel.json.
 *
 * The dbReady promise is passed into createApp() so it is registered
 * as the FIRST middleware — before any route — guaranteeing that the
 * DB schema exists before register/login/favorites are ever called.
 * The promise is cached so subsequent requests on the same instance pay no extra cost.
 */
import { createApp } from '../server/app.js';
import { initDb } from '../server/db.js';

// Kick off schema init immediately; cache the promise for reuse
const dbReady = initDb();

// Build the app with the guard middleware first in chain
const app = createApp(dbReady);

export default app;
