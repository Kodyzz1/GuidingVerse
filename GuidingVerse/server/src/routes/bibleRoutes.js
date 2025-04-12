// --- Imports ---
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// --- Router Setup ---
const router = express.Router();

// Get the directory name using import.meta.url
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);
console.log(`[bibleRoutes] Current directory (currentDir): ${currentDir}`); // Log currentDir
// Path relative to the current file in dist (dist/routes -> dist/data)
const bibleDataPath = path.resolve(currentDir, '../data/BibleJSON/JSON');
console.log(`[bibleRoutes] Base data path calculated: ${bibleDataPath}`); // Log base path

// --- Route Definition (GET /kjv/:book/:chapter) ---
router.get('/kjv/:book/:chapter', async (req, res) => {
  const { book, chapter } = req.params;
  console.log(`[bibleRoutes] Received request for Book: ${book}, Chapter: ${chapter}`); // Log params

  if (!book || !chapter || isNaN(parseInt(chapter, 10))) {
    console.log(`[bibleRoutes] Invalid parameters received.`);
    return res.status(400).json({ message: 'Invalid book or chapter parameter.' });
  }

  try {
    const filePath = path.join(bibleDataPath, book, `${chapter}.json`);
    console.log(`[bibleRoutes] Attempting to read file: ${filePath}`); // Log file path

    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    res.json(jsonData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Log the path that failed specifically in the ENOENT case
      console.error(`[bibleRoutes] File not found (ENOENT): ${error.path}`); 
      res.status(404).json({ message: `Bible chapter not found for ${book} chapter ${chapter}.` });
    } else {
      console.error(`[bibleRoutes] Error reading or parsing file for ${book} ${chapter}:`, error);
      res.status(500).json({ message: 'Internal server error processing request.' });
    }
  }
});

// --- Export Router ---
export default router;