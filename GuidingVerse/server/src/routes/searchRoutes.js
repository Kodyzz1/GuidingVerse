// server/src/routes/searchRoutes.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const router = express.Router();

// Helper to get directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Bible JSON data
const bibleDataPath = path.join(__dirname, '../../data/BibleJSON/JSON');

// GET /api/bible/search - Search the Bible
router.get('/', async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  
  // Basic validation
  if (!q || q.trim() === '') {
    return res.status(400).json({ 
      message: 'Search query is required' 
    });
  }
  
  const searchResults = [];
  const searchQuery = q.toLowerCase().trim();
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  
  try {
    // Get list of books in the Bible data directory
    const bookFolders = await fs.readdir(bibleDataPath, { withFileTypes: true });
    
    // Process each book
    for (const bookFolder of bookFolders) {
      if (!bookFolder.isDirectory()) continue;
      
      const bookName = bookFolder.name;
      const bookPath = path.join(bibleDataPath, bookName);
      
      // Get chapters for this book
      try {
        const chapterFiles = await fs.readdir(bookPath, { withFileTypes: true });
        
        // Process each chapter
        for (const chapterFile of chapterFiles) {
          if (!chapterFile.isFile() || !chapterFile.name.endsWith('.json')) continue;
          
          const chapterNum = parseInt(chapterFile.name.replace('.json', ''), 10);
          const chapterPath = path.join(bookPath, chapterFile.name);
          
          // Read chapter file
          try {
            const chapterContent = await fs.readFile(chapterPath, 'utf-8');
            const chapterData = JSON.parse(chapterContent);
            
            // Search in verses
            if (Array.isArray(chapterData.verses)) {
              for (const verse of chapterData.verses) {
                const verseText = verse.text.toLowerCase();
                
                if (verseText.includes(searchQuery)) {
                  // Create highlighted text
                  const textLower = verse.text.toLowerCase();
                  let highlightedText = verse.text;
                  
                  // Simple highlighting - wrap the search term in <strong> tags
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
            // Continue to next chapter
          }
        }
      } catch (error) {
        console.error(`Error processing book ${bookName}:`, error);
        // Continue to next book
      }
    }
    
    // Sort results by relevance (simple implementation)
    searchResults.sort((a, b) => {
      // Exact matches first, then by book order
      const aExact = a.text.toLowerCase().indexOf(`<strong>${searchQuery}</strong>`) !== -1;
      const bExact = b.text.toLowerCase().indexOf(`<strong>${searchQuery}</strong>`) !== -1;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // If both exact or both not exact, sort by book/chapter/verse
      return 0; // For simplicity, use biblical order
    });
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedResults = searchResults.slice(startIndex, endIndex);
    
    res.json({
      results: paginatedResults,
      total: searchResults.length,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(searchResults.length / limitNum)
    });
    
  } catch (error) {
    console.error('Error in Bible search:', error);
    res.status(500).json({
      message: 'An error occurred while searching the Bible'
    });
  }
});

export default router;