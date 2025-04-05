import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants'; // Adjust path

// Optional: Create CSS module styles later
// import styles from './PassageSelector.module.css';

function PassageSelector({ onPassageChange }) {
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS[0]); // Default to Genesis
  const [selectedChapter, setSelectedChapter] = useState('1'); // Default to chapter 1
  const [availableChapters, setAvailableChapters] = useState(BIBLE_CHAPTER_COUNTS[BIBLE_BOOKS[0]] || 1); // Chapters for default book

  // Update available chapters when book changes
  useEffect(() => {
    const chapters = BIBLE_CHAPTER_COUNTS[selectedBook] || 1; // Get chapter count or default to 1
    setAvailableChapters(chapters);
    // Reset chapter to 1 if the new book has fewer chapters than currently selected
    // Or just always reset to 1 when book changes? Let's reset to 1 for simplicity.
    setSelectedChapter('1');
  }, [selectedBook]);

  // Notify parent component when selection changes
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      onPassageChange({ book: selectedBook, chapter: parseInt(selectedChapter, 10) });
    }
  }, [selectedBook, selectedChapter, onPassageChange]);


  const handleBookChange = (event) => {
    setSelectedBook(event.target.value);
    // Chapter update handled by useEffect dependency on selectedBook
  };

  const handleChapterChange = (event) => {
    setSelectedChapter(event.target.value);
  };

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
        {/* Generate chapter options based on availableChapters */}
        {Array.from({ length: availableChapters }, (_, i) => i + 1).map(chapterNum => (
          <option key={chapterNum} value={chapterNum}>{chapterNum}</option>
        ))}
      </select>
      {/* Verse selection could be added here later */}
    </div>
  );
}

PassageSelector.propTypes = {
  onPassageChange: PropTypes.func.isRequired,
};

export default PassageSelector;