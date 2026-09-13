import express from 'express';
import { getDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      'SELECT id, media_id, type, title, subtitle, image, rating, genres, description, added_at FROM favorites WHERE user_id = ? ORDER BY added_at DESC',
      [req.user.id]
    );

    const favorites = rows.map(row => ({
      dbId: row.id,
      id: row.media_id,
      type: row.type,
      title: row.title,
      subtitle: row.subtitle || '',
      image: row.image || null,
      rating: row.rating,
      genres: row.genres ? JSON.parse(row.genres) : [],
      description: row.description || '',
      addedAt: row.added_at
    }));

    return res.json(favorites);
  } catch (error) {
    console.error('Fetch favorites error:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites.' });
  }
});