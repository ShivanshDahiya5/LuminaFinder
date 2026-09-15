import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import mediaRoutes from './routes/media.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api', mediaRoutes);

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
