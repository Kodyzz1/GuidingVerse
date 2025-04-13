// --- Imports ---
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants';
// TODO: Create and import PassageSelector.module.css if needed
// import styles from './PassageSelector.module.css';

// --- Component Definition ---
function PassageSelector({ onPassageChange, initialBook = BIBLE_BOOKS[0], initialChapter = 1 }) {
  // --- State ---
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(String(initialChapter));

  // --- Effect to Sync with Props --- //
  // Update internal state if initial props change (e.g., from history navigation)
  useEffect(() => {
    setSelectedBook(initialBook);
    setSelectedChapter(String(initialChapter));
  }, [initialBook, initialChapter]); // Re-run effect if these props change

  // --- Handlers ---
  const handleBookChange = (event) => {
    const newBook = event.target.value;
    const newChapter = '1'; // Always reset chapter to 1 on book change

    setSelectedBook(newBook);
    setSelectedChapter(newChapter);

    onPassageChange({ book: newBook, chapter: parseInt(newChapter, 10) });
  };

  const handleChapterChange = (event) => {
    const newChapter = event.target.value;
    setSelectedChapter(newChapter);

    onPassageChange({ book: selectedBook, chapter: parseInt(newChapter, 10) });
  };

  // --- JSX Structure ---
  // Optional: Use styles.selectorContainer if using CSS Modules
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <label htmlFor="book-select" style={{ marginRight: '0.5rem' }}>Book: </label>
      <select 
        id="book-select" 
        value={selectedBook} 
        onChange={handleBookChange}
        style={{ marginRight: '1rem' }}
      >
        {BIBLE_BOOKS.map(book => (
          <option key={book} value={book}>{book}</option>
        ))}
      </select>

      <label htmlFor="chapter-select" style={{ marginRight: '0.5rem' }}>Chapter: </label>
      <select id="chapter-select" value={selectedChapter} onChange={handleChapterChange}>
        {Array.from({ length: BIBLE_CHAPTER_COUNTS[selectedBook] || 1 }, (_, i) => i + 1).map(chapterNum => (
          <option key={chapterNum} value={chapterNum}>{chapterNum}</option>
        ))}
      </select>
    </div>
  );
}

// --- Prop Types ---
PassageSelector.propTypes = {
  onPassageChange: PropTypes.func.isRequired,
  initialBook: PropTypes.string,
  initialChapter: PropTypes.number,
};

export default PassageSelector;