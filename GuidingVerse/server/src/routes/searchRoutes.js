// --- Imports ---
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// --- Router Setup ---
const router = express.Router();

// --- Constants & Helpers ---
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);
const bibleDataPath = path.resolve(currentDir, '../data/BibleJSON/JSON');

// --- Route Definition (GET /) ---
router.get('/', async (req, res) => {
  // --- Query Params & Validation ---
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim() === '') {
    return res.status(400).json({
      message: 'Search query is required'
    });
  }

  // --- Initialization ---
  const searchResults = [];
  const searchQuery = q.toLowerCase().trim();
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;

  try {
    // --- File System Iteration (Books -> Chapters -> Verses) ---
    const bookFolders = await fs.readdir(bibleDataPath, { withFileTypes: true });

    for (const bookFolder of bookFolders) {
      if (!bookFolder.isDirectory()) continue;

      const bookName = bookFolder.name;
      const bookPath = path.join(bibleDataPath, bookName);

      try {
        const chapterFiles = await fs.readdir(bookPath, { withFileTypes: true });

        for (const chapterFile of chapterFiles) {
          if (!chapterFile.isFile() || !chapterFile.name.endsWith('.json')) continue;

          const chapterNum = parseInt(chapterFile.name.replace('.json', ''), 10);
          const chapterPath = path.join(bookPath, chapterFile.name);

          try {
            const chapterContent = await fs.readFile(chapterPath, 'utf-8');
            const chapterData = JSON.parse(chapterContent);

            if (Array.isArray(chapterData.verses)) {
              for (const verse of chapterData.verses) {
                const verseText = verse.text.toLowerCase();

                if (verseText.includes(searchQuery)) {
                  const textLower = verse.text.toLowerCase();
                  let highlightedText = verse.text;

                  // Simple highlighting: wrap the search term in <strong> tags
                  const startIndex = textLower.indexOf(searchQuery);
                  if (startIndex !== -1) {
                    const endIndex = startIndex + searchQuery.length;
                    highlightedText =
                      verse.text.substring(0, startIndex) +
                      '<strong>' + verse.text.substring(startIndex, endIndex) + '</strong>' +
                      verse.text.substring(endIndex);
                  }

                  searchResults.push({
                    book: bookName,
                    chapter: chapterNum,
                    verse: verse.verse,
                    text: highlightedText,
                    reference: `${bookName} ${chapterNum}:${verse.verse}`
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error processing chapter ${bookName} ${chapterNum}:`, error);
            // Continue processing next chapter even if one fails
          }
        }
      } catch (error) {
        console.error(`Error processing book ${bookName}:`, error);
        // Continue processing next book even if one fails
      }
    }

    // --- Sorting (Currently maintains biblical order) ---
    searchResults.sort((a, b) => {
      return 0;
    });

    // --- Pagination ---
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedResults = searchResults.slice(startIndex, endIndex);

    // --- Response ---
    res.json({
      results: paginatedResults,
      total: searchResults.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(searchResults.length / limitNum)
    });

  } catch (error) {
    // --- Error Handling ---
    console.error('Error in Bible search:', error);
    res.status(500).json({
      message: 'An error occurred while searching the Bible'
    });
  }
});

// --- Export Router ---
export default router;