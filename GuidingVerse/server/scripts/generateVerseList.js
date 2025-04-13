import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const bibleDataSourceDir = path.resolve('../data/BibleJSON/JSON'); // Path relative to script location
const outputFilePath = path.resolve('../data/verse_list.json');
const booksOrder = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", 
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", 
  "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", 
  "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", 
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", 
  "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", 
  "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", 
  "Matthew", "Mark", "Luke", "John", 
  "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", 
  "Ephesians", "Philippians", "Colossians", 
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", 
  "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", 
  "Revelation"
];

async function generateVerseList() {
  console.log('Starting verse list generation...');
  const allVerses = [];

  try {
    for (const book of booksOrder) {
      const bookPath = path.join(bibleDataSourceDir, book);
      console.log(`Processing book: ${book}`);
      try {
        const chapterFiles = await fs.readdir(bookPath);
        
        // Sort chapter files numerically (e.g., 1.json, 2.json, 10.json)
        const sortedChapterFiles = chapterFiles
          .filter(file => file.endsWith('.json') && !isNaN(parseInt(path.basename(file, '.json'))))
          .sort((a, b) => parseInt(path.basename(a, '.json')) - parseInt(path.basename(b, '.json')));

        for (const chapterFile of sortedChapterFiles) {
          const chapterNum = parseInt(path.basename(chapterFile, '.json'));
          const filePath = path.join(bookPath, chapterFile);
          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const chapterData = JSON.parse(fileContent);
            
            if (chapterData && Array.isArray(chapterData.verses)) {
              // Sort verses numerically based on the verse number
              const sortedVerses = chapterData.verses.sort((a, b) => a.verse - b.verse);
              sortedVerses.forEach(verse => {
                allVerses.push({ 
                  book: book,
                  chapter: chapterNum, 
                  verse: verse.verse 
                });
              });
            } else {
              console.warn(`Skipping ${book} ${chapterNum}: Invalid format or missing verses array.`);
            }
          } catch (readError) {
            console.error(`Error reading or parsing ${filePath}:`, readError);
          }
        }
      } catch (bookError) {
         if (bookError.code === 'ENOENT') {
            console.warn(`Directory not found for book: ${book}. Skipping.`);
         } else {
            console.error(`Error processing directory for book ${book}:`, bookError);
         }
      }
    }

    console.log(`Total verses found: ${allVerses.length}`);

    if (allVerses.length > 0) {
        await fs.writeFile(outputFilePath, JSON.stringify(allVerses, null, 2)); // Pretty print JSON
        console.log(`Verse list successfully generated at: ${outputFilePath}`);
    } else {
        console.error('No verses found. Output file not generated.');
    }

  } catch (error) {
    console.error('An error occurred during verse list generation:', error);
  }
}

generateVerseList(); 