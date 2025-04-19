import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js'; // Assuming logger is in the same directory

// --- Constants & State ---
const EPOCH_START_DATE = new Date(2024, 0, 1); // January 1st, 2024
let verseList = [];
let verseListError = null;
let currentVOTD = null; // Stores { book, chapter, verse, text }
let currentVOTDDate = null; // Stores 'YYYY-MM-DD' string for the currentVOTD

const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);

// Determine base path based on environment
const isProduction = process.env.NODE_ENV === 'production';
// Path relative to this file (src/utils) -> needs to go up to server/data
const relativeDataPath = isProduction ? '../../data' : '../../data'; 
const baseDataPath = path.resolve(currentDir, relativeDataPath);

// --- Helper function to get YYYY-MM-DD date string ---
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- Load Verse List ---
async function loadVerseList() {
  const listPath = path.join(baseDataPath, 'verse_list.json');
  logger.info(`[VOTD Service] Attempting to load verse list from: ${listPath}`);
  try {
    const data = await fs.readFile(listPath, 'utf-8');
    verseList = JSON.parse(data);
    logger.info(`[VOTD Service] Successfully loaded ${verseList.length} verses.`);
  } catch (err) {
    verseListError = `Failed to load verse list: ${err.message}`;
    logger.error('[VOTD Service]', verseListError, `Path attempted: ${listPath}`);
    verseList = []; // Ensure it's empty on error
  }
}

// --- Select and Store New Random VOTD ---
async function selectNewVOTD() {
    if (verseListError || verseList.length === 0) {
        logger.error('[VOTD Service] Cannot select new VOTD, verse list not available.');
        return null; // Indicate failure
    }
    
    try {
        const todayString = getLocalDateString(new Date());
        logger.info(`[VOTD Service] Selecting new random VOTD for ${todayString}.`);

        // --- RANDOM SELECTION ---
        const randomIndex = Math.floor(Math.random() * verseList.length);
        const targetVerseRef = verseList[randomIndex];
        // --- END RANDOM SELECTION ---

        if (!targetVerseRef) {
            logger.error('[VOTD Service] Randomly selected verse reference is invalid.', { randomIndex, listLength: verseList.length });
            throw new Error('Randomly selected verse reference is invalid.');
        }

        logger.info(`[VOTD Service] New VOTD selected: Index ${randomIndex}, Target: ${targetVerseRef.book} ${targetVerseRef.chapter}:${targetVerseRef.verse}`);

        // Construct path and read chapter file
        const bibleJsonPath = path.join(baseDataPath, 'BibleJSON/JSON');
        const chapterFilePath = path.join(bibleJsonPath, targetVerseRef.book, `${targetVerseRef.chapter}.json`);
        const chapterFileContent = await fs.readFile(chapterFilePath, 'utf-8');
        const chapterData = JSON.parse(chapterFileContent);

        // Find the specific verse
        const verseData = chapterData?.verses?.find(v => v.verse === targetVerseRef.verse);
        if (!verseData) {
            logger.error(`[VOTD Service] Verse ${targetVerseRef.verse} not found in chapter data.`, { chapterPath: chapterFilePath });
            throw new Error(`Verse ${targetVerseRef.verse} not found in chapter data.`);
        }

        // Update the stored VOTD
        currentVOTD = {
            book: targetVerseRef.book,
            chapter: targetVerseRef.chapter,
            verse: verseData.verse,
            text: verseData.text,
        };
        currentVOTDDate = todayString;
        logger.info(`[VOTD Service] Stored new VOTD for ${currentVOTDDate}: ${currentVOTD.book} ${currentVOTD.chapter}:${currentVOTD.verse}`);
        return currentVOTD;

    } catch (error) {
        logger.error('[VOTD Service] Error selecting new VOTD:', error);
        currentVOTD = null; // Reset on error
        currentVOTDDate = null;
        return null; // Indicate failure
    }
}

// --- Public Functions ---

/**
 * Gets the current Verse of the Day. If the day has changed since the last fetch,
 * it selects a new random verse for today.
 * @returns {Promise<object|null>} The VOTD object { book, chapter, verse, text } or null if unavailable.
 */
export async function getCurrentVOTD() {
    if (verseListError) {
        logger.error('[VOTD Service - getCurrentVOTD] Verse list failed to load previously.');
        return null;
    }
    if (verseList.length === 0 && !verseListError) {
         logger.warn('[VOTD Service - getCurrentVOTD] Verse list is loaded but empty.');
         // Optionally try loading again? For now, just return null.
         // await loadVerseList(); // Re-attempt load?
         // if(verseList.length === 0) return null;
         return null;
    }


    const todayString = getLocalDateString(new Date());

    if (todayString !== currentVOTDDate || !currentVOTD) {
        // Date is different or no VOTD exists, select a new one
        return await selectNewVOTD();
    } else {
        // Return the already stored VOTD for today
        logger.info(`[VOTD Service - getCurrentVOTD] Returning cached VOTD for ${todayString}`);
        return currentVOTD;
    }
}

/**
 * Gets the currently stored VOTD details without triggering a new selection.
 * Used by the notification scheduler.
 * @returns {{ votd: object|null, date: string|null }} Object containing the stored VOTD and its date string.
 */
export function getStoredVOTDDetails() {
    return {
        votd: currentVOTD,
        date: currentVOTDDate,
        dateStringForToday: getLocalDateString(new Date()) // Also return today's date string for easy comparison
    };
}


// --- Initialize ---
// Load the verse list when the service starts
loadVerseList(); 