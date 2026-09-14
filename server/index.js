import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import favoritesRoutes from './routes/favorites.js';
import mediaRoutes from './routes/media.js';
import { getDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api', mediaRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server first then init DB
const server = app.listen(PORT, () => {
  console.log(`🚀 LuminaFinder Full-Stack Backend running on http://localhost:${PORT}`);
  getDb().then(() => {
    console.log('✅ SQLite Database connected & schema initialized.');
  }).catch(err => {
    console.error('❌ Failed to initialize database:', err);
  });
});

// Keep process active in non-interactive shell environments
setInterval(() => {}, 3600000);