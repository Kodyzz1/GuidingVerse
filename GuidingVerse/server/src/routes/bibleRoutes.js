// --- Imports ---
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Router Setup ---
const router = express.Router();

// --- Constants & Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Route Definition (GET /kjv/:book/:chapter) ---
router.get('/kjv/:book/:chapter', (req, res) => {
  res.json({ message: 'Test route' });
});

// --- Export Router ---
export default router;