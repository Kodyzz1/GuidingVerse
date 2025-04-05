import React, { useState, useEffect /* Remove useEffect if no longer needed */ } from 'react';
import PropTypes from 'prop-types';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants'; // Adjust path

// import styles from './PassageSelector.module.css'; // Optional CSS

function PassageSelector({ onPassageChange, initialBook = BIBLE_BOOKS[0], initialChapter = 1 }) {
  // Initialize state using initial props or defaults
  const [selectedBook, setSelectedBook] = useState(initialBook);
  const [selectedChapter, setSelectedChapter] = useState(String(initialChapter)); // Keep as string for select value
  const [availableChapters, setAvailableChapters] = useState(BIBLE_CHAPTER_COUNTS[initialBook] || 1);

  // Effect to update chapter count when book changes (only if needed besides handler - let's keep it for now)
   useEffect(() => {
     const chapters = BIBLE_CHAPTER_COUNTS[selectedBook] || 1;
     setAvailableChapters(chapters);
     // We reset the chapter itself in handleBookChange now
   }, [selectedBook]);

  const handleBookChange = (event) => {
    const newBook = event.target.value;
    const newChapter = '1'; // Always reset chapter to 1 on book change
    const chapters = BIBLE_CHAPTER_COUNTS[newBook] || 1; // Update available chapters count too

    // Update state for book, chapter, and available chapters
    setSelectedBook(newBook);
    setSelectedChapter(newChapter);
    setAvailableChapters(chapters); // Update dropdown options

    // Notify parent immediately with the NEW book and RESET chapter
    onPassageChange({ book: newBook, chapter: parseInt(newChapter, 10) });
  };

  const handleChapterChange = (event) => {
    const newChapter = event.target.value;
    setSelectedChapter(newChapter);

    // Notify parent about the chapter change
    onPassageChange({ book: selectedBook, chapter: parseInt(newChapter, 10) });
  };

  // No longer need useEffect to call onPassageChange

  return (
    // Optional: <div className={styles.selectorContainer}>
    <div>
      <label htmlFor="book-select">Book: </label>
      <select id="book-select" value={selectedBook} onChange={handleBookChange}>
        {BIBLE_BOOKS.map(book => (
          <option key={book} value={book}>{book}</option>
        ))}
      </select>

      <label htmlFor="chapter-select" style={{ marginLeft: '1rem' }}>Chapter: </label>
      <select id="chapter-select" value={selectedChapter} onChange={handleChapterChange}>
        {Array.from({ length: availableChapters }, (_, i) => i + 1).map(chapterNum => (
          <option key={chapterNum} value={chapterNum}>{chapterNum}</option>
        ))}
      </select>
    </div>
  );
}

PassageSelector.propTypes = {
  onPassageChange: PropTypes.func.isRequired,
  initialBook: PropTypes.string, // Optional initial values
  initialChapter: PropTypes.number, // Optional initial values
};

export default PassageSelector;