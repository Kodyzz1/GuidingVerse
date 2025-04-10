// --- Imports ---
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// --- Router Setup ---
const router = express.Router();

// --- Constants & Helpers ---
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);
const bibleDataPath = path.join(currentDir, '../../data/BibleJSON/JSON');

// --- Route Definition (GET /kjv/:book/:chapter) ---
router.get('/kjv/:book/:chapter', async (req, res) => {
  const { book, chapter } = req.params;

  if (!book || !chapter || isNaN(parseInt(chapter, 10))) {
    return res.status(400).json({ message: 'Invalid book or chapter parameter.' });
  }

  try {
    const filePath = path.join(bibleDataPath, book, `${chapter}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    res.json(jsonData);
  } catch (error) {
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