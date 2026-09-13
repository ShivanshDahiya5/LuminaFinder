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

