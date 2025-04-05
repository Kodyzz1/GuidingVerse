// server/src/routes/bibleRoutes.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Using the promise-based version of the file system module

const router = express.Router();

// --- Helper to get directory name in ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Path to the Bible JSON data ---
// Assumes this file is in server/src/routes/ and data is in server/data/BibleJSON/JSON/
const bibleDataPath = path.join(__dirname, '../../data/BibleJSON/JSON');

// --- Define API Route ---
// GET /api/bible/kjv/:book/:chapter
router.get('/kjv/:book/:chapter', async (req, res) => {
  // Extract book and chapter from URL parameters
  const { book, chapter } = req.params;

  // Basic validation (can be expanded later)
  if (!book || !chapter || isNaN(parseInt(chapter, 10))) {
    return res.status(400).json({ message: 'Invalid book or chapter parameter.' });
  }

  try {
    // Construct the file path dynamically
    // Uses the book name directly as the directory name (e.g., "1 Chronicles", "Genesis")
    const filePath = path.join(bibleDataPath, book, `${chapter}.json`);

    console.log(`Attempting to read: ${filePath}`); // For debugging

    // Asynchronously read the file content
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse the JSON content
    const jsonData = JSON.parse(fileContent);

    // Send the parsed JSON data back to the client
    res.json(jsonData);

  } catch (error) {
    // Handle errors, specifically file not found
    if (error.code === 'ENOENT') {
      console.error(`File not found: ${error.path}`);
      res.status(404).json({ message: `Bible chapter not found for ${book} chapter ${chapter}.` });
    } else {
      // Handle other errors (e.g., JSON parsing issues, permissions)
      console.error(`Error reading or parsing file for ${book} ${chapter}:`, error);
      res.status(500).json({ message: 'Internal server error processing request.' });
    }
  }
});

// Export the router
export default router;