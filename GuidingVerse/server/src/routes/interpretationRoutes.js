import 'dotenv/config'; // Load .env variables FIRST (might not be needed anymore, but safe to keep)
// --- Imports ---
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // To resolve __dirname in ES Modules

// --- Determine Directory Path --- //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const interpretationsBasePath = path.join(__dirname, '../data/interpretations');

// --- Helper Function to Load Chapter Data --- //
// Cache loaded chapters to avoid repeated file reads
const chapterCache = {}; 

function clearChapterCache() {
  Object.keys(chapterCache).forEach(key => delete chapterCache[key]);
}

function getChapterInterpretations(book, chapter) {
  const cacheKey = `${book}-${chapter}`;
  
  // Clear cache if it gets too large (optional)
  if (Object.keys(chapterCache).length > 100) {
    clearChapterCache();
  }
  
  if (chapterCache[cacheKey]) {
    console.log(`Returning cached interpretation for ${book} ${chapter}`);
    return chapterCache[cacheKey]; // Return from cache if available
  }

  const filePath = path.join(interpretationsBasePath, book, `${chapter}.json`);
  console.log(`Loading interpretation from file: ${filePath}`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const chapterData = JSON.parse(fileContent);
    chapterCache[cacheKey] = chapterData; // Store in cache
    console.log(`Successfully loaded and cached interpretation data for: ${book} ${chapter}`);
    return chapterData;
  } catch (error) {
    console.error(`Error accessing interpretation file: ${filePath}`, error);
    delete chapterCache[cacheKey]; // Remove error state from cache
    return null;
  }
}

// --- Router Setup --- //
const router = express.Router();

// --- Route for Chapter Summary (GET /chapter/:book/:chapter?denomination=...) --- //
router.get('/chapter/:book/:chapter', (req, res) => {
  const { book, chapter } = req.params;
  const denomination = req.query.denomination;
  console.log('Received chapter summary request:', { book, chapter, denomination });

  if (!book || !chapter) {
    return res.status(400).json({ message: 'Book and chapter are required.' });
  }

  try {
    const chapterData = getChapterInterpretations(book, chapter); // Reuse existing helper

    if (chapterData && chapterData.chapterSummary) { // Look for "chapterSummary" key
      const summaryInterpretations = chapterData.chapterSummary;
      let interpretationText = null;
      let sourceDenomination = null;

      // Apply denomination fallback logic
      if (denomination && denomination !== 'Prefer not to say' && summaryInterpretations[denomination]) {
        interpretationText = summaryInterpretations[denomination];
        sourceDenomination = denomination;
      } else if (summaryInterpretations["General"]) {
        interpretationText = summaryInterpretations["General"];
        sourceDenomination = "General";
      } 

      if (interpretationText !== null) {
        console.log(`Found chapter summary for: ${book} ${chapter} (Denomination: ${sourceDenomination})`);
        res.json({ 
          reference: `${book} ${chapter} (Chapter Summary)`, 
          interpretation: interpretationText, 
          source: 'static',
          type: 'chapter', // Indicate type
          sourceDenomination: sourceDenomination
        });
      } else {
        console.log(`No suitable chapter summary (Specific or General) found for: ${book} ${chapter}`);
        res.status(404).json({ message: `No suitable chapter summary found for ${book} ${chapter}.` });
      }
    } else {
      console.log(`Chapter summary key not found or chapter file missing for ${book} ${chapter}.`);
      res.status(404).json({ message: `No chapter summary data found for ${book} chapter ${chapter}.` });
    }
  } catch (error) {
    console.error('Error processing chapter summary request:', error);
    res.status(500).json({ message: 'Internal server error retrieving chapter summary.' });
  }
});

// --- Route for Book Summary (GET /book/:book?denomination=...) --- //
router.get('/book/:book', (req, res) => {
  const { book } = req.params;
  const denomination = req.query.denomination;
  console.log('Received book summary request:', { book, denomination });

  if (!book) {
    return res.status(400).json({ message: 'Book is required.' });
  }

  const filePath = path.join(interpretationsBasePath, book, `_bookSummary.json`);
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const bookSummaryData = JSON.parse(rawData);

      let interpretationText = null;
      let sourceDenomination = null;

      // Apply denomination fallback logic
      if (denomination && denomination !== 'Prefer not to say' && bookSummaryData[denomination]) {
        interpretationText = bookSummaryData[denomination];
        sourceDenomination = denomination;
      } else if (bookSummaryData["General"]) {
        interpretationText = bookSummaryData["General"];
        sourceDenomination = "General";
      }

      if (interpretationText !== null) {
        console.log(`Found book summary for: ${book} (Denomination: ${sourceDenomination})`);
        res.json({ 
          reference: `${book} (Book Summary)`, 
          interpretation: interpretationText, 
          source: 'static',
          type: 'book', // Indicate type
          sourceDenomination: sourceDenomination
        });
      } else {
         console.log(`No suitable book summary (Specific or General) found for: ${book}`);
         res.status(404).json({ message: `No suitable book summary found for ${book}.` });
      }
    } else {
      console.log(`Book summary file not found: ${filePath}`);
      res.status(404).json({ message: `No book summary data found for ${book}.` });
    }
  } catch (error) {
    console.error(`Error loading or parsing book summary file: ${filePath}`, error);
    res.status(500).json({ message: 'Internal server error retrieving book summary.' });
  }
});

// --- Route for Specific Verse (GET /:reference?denomination=...) --- //
router.get('/:reference', (req, res) => {
  // --- Request Info --- //
  const rawReference = req.params.reference; // e.g., "Genesis 1:2" or "John 3:16-17"
  const denomination = req.query.denomination;
  console.log('Received verse interpretation request:', { reference: rawReference, denomination });

  // --- Parse Reference --- //
  const match = rawReference.match(/^(\d?\s?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  
  if (!match) {
      console.error('Invalid verse reference format:', rawReference);
      return res.status(400).json({ message: 'Invalid verse reference format. Use format like "Genesis 1:1".' });
  }

  const book = match[1].trim(); 
  const chapter = match[2]; 
  const verse = match[3]; 
  console.log('Parsed reference:', { book, chapter, verse });

  // --- Validation ---
  if (!book || !chapter || !verse) {
    console.error('Missing reference components:', { book, chapter, verse });
    return res.status(400).json({ message: 'Invalid reference components.' });
  }

  // --- Data Lookup Logic ---
  try {
    console.log('Attempting to load chapter data for:', { book, chapter });
    const chapterData = getChapterInterpretations(book, chapter);

    if (chapterData) {
      console.log('Found chapter data, looking for verse:', verse);
      const verseInterpretations = chapterData[verse];

      if (verseInterpretations) {
          let interpretationText = null;
          let sourceDenomination = null;

          // Denomination fallback logic
          if (denomination && denomination !== 'Prefer not to say' && verseInterpretations[denomination]) {
            interpretationText = verseInterpretations[denomination];
            sourceDenomination = denomination;
            console.log(`Found specific denomination interpretation for: ${book} ${chapter}:${verse} (${denomination})`);
          } 
          else if (verseInterpretations["General"]) {
            interpretationText = verseInterpretations["General"];
            sourceDenomination = "General";
            console.log(`Using General interpretation for: ${book} ${chapter}:${verse} (fallback)`);
          }

          if (interpretationText !== null) {
            console.log('Sending successful response with interpretation');
            res.json({ 
              reference: rawReference, 
              interpretation: interpretationText, 
              source: 'static',
              type: 'verse',
              sourceDenomination: sourceDenomination
            });
          } else {
            console.log(`No suitable interpretation found for: ${book} ${chapter}:${verse}`);
            res.status(404).json({ message: `No suitable interpretation found for ${rawReference}.` });
          }
      } else {
          console.error(`Verse ${verse} not found in chapter data for ${book} ${chapter}`);
          res.status(404).json({ message: `No interpretation data found for verse ${verse} of ${book} ${chapter}.` });
      }
    } else {
      console.error(`No chapter data found for ${book} ${chapter}`);
      res.status(404).json({ message: `No interpretation data found for ${book} chapter ${chapter}.` });
    }

  } catch (error) {
    console.error('Error processing verse interpretation request:', error);
    res.status(500).json({ message: 'Internal server error retrieving verse interpretation.' });
  }
});

// --- Export Router --- //
export default router;

// --- Remove all previous async/AI code --- //
/*
export async function setupInterpretationRoutes() { ... }
loadAiPlatform().then(...) { ... }
*/ 