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

router.post('/', async (req, res) => {
  try {
    const { id, type, title, subtitle, image, rating, genres, description } = req.body;

    if (!id || !type || !title) {
      return res.status(400).json({ error: 'Missing required media fields (id, type, title).' });
    }

    const db = await getDb();
    const genresJson = JSON.stringify(genres || []);

    await db.run(
      `INSERT OR REPLACE INTO favorites (user_id, media_id, type, title, subtitle, image, rating, genres, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, String(id), type, title, subtitle || '', image || null, rating || null, genresJson, description || '']
    );

    return res.status(201).json({ message: 'Added to library favorites!', id: String(id), type });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Failed to add item to favorites.' });
  }
});

router.delete('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    const db = await getDb();
    await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND media_id = ? AND type = ?',
      [req.user.id, String(id), type]
    );

    return res.json({ message: 'Removed from library favorites.', id, type });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Failed to remove favorite.' });
  }
});

export default router;
