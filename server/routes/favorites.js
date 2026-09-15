import express from 'express';
import { getDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, media_id, type, title, subtitle, image, rating, genres, description, added_at
      FROM favorites
      WHERE user_id = ${req.user.id}
      ORDER BY added_at DESC
    `;

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

    const sql = getDb();
    const genresJson = JSON.stringify(genres || []);

    // PostgreSQL upsert (replaces SQLite's INSERT OR REPLACE)
    await sql`
      INSERT INTO favorites (user_id, media_id, type, title, subtitle, image, rating, genres, description)
      VALUES (
        ${req.user.id}, ${String(id)}, ${type}, ${title},
        ${subtitle || ''}, ${image || null}, ${rating || null},
        ${genresJson}, ${description || ''}
      )
      ON CONFLICT (user_id, media_id, type) DO UPDATE SET
        title       = EXCLUDED.title,
        subtitle    = EXCLUDED.subtitle,
        image       = EXCLUDED.image,
        rating      = EXCLUDED.rating,
        genres      = EXCLUDED.genres,
        description = EXCLUDED.description
    `;

    return res.status(201).json({ message: 'Added to library favorites!', id: String(id), type });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Failed to add item to favorites.' });
  }
});

router.delete('/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    const sql = getDb();
    await sql`
      DELETE FROM favorites
      WHERE user_id = ${req.user.id} AND media_id = ${String(id)} AND type = ${type}
    `;

    return res.json({ message: 'Removed from library favorites.', id, type });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Failed to remove favorite.' });
  }
});

export default router;
