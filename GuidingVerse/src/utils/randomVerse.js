import fs from 'fs';
import path from 'path';

export function getRandomVerse() {
  try {
    // Get all book directories
    const booksDir = path.join(process.cwd(), 'server/src/data/bible/kjv');
    const books = fs.readdirSync(booksDir);

    // Select a random book
    const randomBook = books[Math.floor(Math.random() * books.length)];
    const bookDir = path.join(booksDir, randomBook);

    // Get all chapters in the book
    const chapters = fs.readdirSync(bookDir);
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
    const chapterPath = path.join(bookDir, randomChapter);

    // Read the chapter file
    const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf8'));
    
    // Get a random verse
    const verses = chapterData.verses;
    const randomVerse = verses[Math.floor(Math.random() * verses.length)];

    return {
      book: randomBook,
      chapter: randomChapter.replace('.json', ''),
      verse: randomVerse.verse,
      text: randomVerse.text
    };
  } catch (error) {
    console.error('Error getting random verse:', error);
    return null;
  }
} 