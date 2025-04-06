// --- Imports ---
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// --- Router Setup ---
const router = express.Router();

// --- Constants & Helpers ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const bibleDataPath = path.join(__dirname, '../../data/BibleJSON/JSON');

// --- Route Definition (GET /kjv/:book/:chapter) ---
router.get('/kjv/:book/:chapter', async (req, res) => {
  // --- Path Params & Validation ---
  const { book, chapter } = req.params;

  if (!book || !chapter || isNaN(parseInt(chapter, 10))) {
    return res.status(400).json({ message: 'Invalid book or chapter parameter.' });
  }

  try {
    // --- File Reading & Parsing ---
    const filePath = path.join(bibleDataPath, book, `${chapter}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    // --- Response ---
    res.json(jsonData);

  } catch (error) {
    // --- Error Handling ---
    if (error.code === 'ENOENT') {
      console.error(`File not found: ${error.path}`);
      res.status(404).json({ message: `Bible chapter not found for ${book} chapter ${chapter}.` });
    } else {
      console.error(`Error reading or parsing file for ${book} ${chapter}:`, error);
      res.status(500).json({ message: 'Internal server error processing request.' });
    }
  }
});

// --- Export Router ---
export default router;