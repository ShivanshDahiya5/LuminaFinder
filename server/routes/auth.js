import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';

const router = express.Router();
export const JWT_SECRET = process.env.JWT_SECRET || 'lumina_finder_jwt_secret_key_2026';
