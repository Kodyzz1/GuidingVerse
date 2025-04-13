import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// --- Constants & Helpers ---
const EPOCH_START_DATE = new Date(2024, 0, 1); // January 1st, 2024
let verseList = [];
let verseListError = null;

const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);

// Determine base path based on environment
const isProduction = process.env.NODE_ENV === 'production';
const relativeDataPath = isProduction ? '../data' : '../../data';
const baseDataPath = path.resolve(currentDir, relativeDataPath);

// --- Load Verse List Asynchronously --- //
async function loadVerseList() {
  const listPath = path.join(baseDataPath, 'verse_list.json');
  console.log(`[VerseOfTheDay] Attempting to load verse list from: ${listPath}`);
  try {
    const data = await fs.readFile(listPath, 'utf-8');
    verseList = JSON.parse(data);
    console.log(`[VerseOfTheDay] Successfully loaded ${verseList.length} verses.`);
  } catch (err) {
    verseListError = `Failed to load verse list: ${err.message}`;
    console.error('[VerseOfTheDay]', verseListError, `Path attempted: ${listPath}`);
    verseList = []; // Ensure it's empty on error
  }
}

loadVerseList(); // Load the list when the module starts

// --- Route Handler --- //
router.get('/', async (req, res) => {
  if (verseListError || verseList.length === 0) {
    return res.status(500).json({ 
      message: 'Verse list not available.', 
      error: verseListError || 'Verse list is empty.' 
    });
  }

  try {
    // Calculate deterministic index
    const now = new Date();
    const diffTime = Math.abs(now - EPOCH_START_DATE);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    const verseIndex = diffDays % verseList.length;
    const targetVerseRef = verseList[verseIndex];

    if (!targetVerseRef) {
      throw new Error('Calculated verse reference is invalid.');
    }

    console.log(`[VerseOfTheDay] Day ${diffDays}, Index ${verseIndex}, Target: ${targetVerseRef.book} ${targetVerseRef.chapter}:${targetVerseRef.verse}`);

    // Construct path to the chapter file
    const bibleJsonPath = path.join(baseDataPath, 'BibleJSON/JSON');
    const chapterFilePath = path.join(bibleJsonPath, targetVerseRef.book, `${targetVerseRef.chapter}.json`);
    console.log(`[VerseOfTheDay] Reading chapter file: ${chapterFilePath}`);

    // Read chapter file
    const chapterFileContent = await fs.readFile(chapterFilePath, 'utf-8');
    const chapterData = JSON.parse(chapterFileContent);

    // Find the specific verse
    const verseData = chapterData?.verses?.find(v => v.verse === targetVerseRef.verse);

    if (!verseData) {
      throw new Error(`Verse ${targetVerseRef.verse} not found in chapter data for ${targetVerseRef.book} ${targetVerseRef.chapter}.`);
    }

    // Return the verse data
    res.json({
      book: targetVerseRef.book,
      chapter: targetVerseRef.chapter,
      verse: verseData.verse,
      text: verseData.text,
    });

  } catch (error) {
    console.error('[VerseOfTheDay] Error processing request:', error);
    // Distinguish file not found from other errors
    if (error.code === 'ENOENT') {
        res.status(404).json({ message: 'Could not load data for the selected verse of the day.', error: error.message });
    } else {
        res.status(500).json({ message: 'Internal server error processing verse of the day.', error: error.message });
    }
  }
});

export default router; 