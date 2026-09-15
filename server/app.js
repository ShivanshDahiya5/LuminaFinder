import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import mediaRoutes from './routes/media.js';

/**
 * Creates and configures the Express app.
 * @param {Promise|null} dbReady - Optional promise to await before handling any request.
 *   Used by the Vercel entry point to guarantee DB tables exist before the first request.
 */
export function createApp(dbReady = null) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // If a dbReady promise is provided, gate every request on it first
  if (dbReady) {
    app.use(async (_req, _res, next) => {
      try {
        await dbReady;
        next();
      } catch (err) {
        console.error('DB init failed:', err);
        next(err);
      }
    });
  }

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api', mediaRoutes);

  // Healthcheck
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

// Default export: app without a dbReady guard (used by local dev server)
export default createApp();
