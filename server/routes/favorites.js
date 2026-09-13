import express from 'express';
import { getDb } from '../db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// All favorites routes require authentication
router.use(authenticateToken);