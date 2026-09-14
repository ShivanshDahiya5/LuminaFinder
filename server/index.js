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
