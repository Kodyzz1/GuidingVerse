import React, { useState, useCallback } from 'react';
import PassageSelector from '../components/PassageSelector';
import BibleTextDisplay from '../components/BibleTextDisplay';
// Optional: Create CSS module styles later
// import styles from './BibleReaderPage.module.css';

function BibleReaderPage() {
  // State to hold the currently selected passage
  const [selectedPassage, setSelectedPassage] = useState({
    book: 'Genesis', // Default book
    chapter: 1,      // Default chapter
  });

  // Callback function to update the passage state from the selector
  // Use useCallback to prevent unnecessary re-renders of PassageSelector if BibleReaderPage re-renders
  const handlePassageChange = useCallback((newPassage) => {
    setSelectedPassage(newPassage);
    console.log('Passage changed to:', newPassage); // For debugging
  }, []); // No dependencies, function reference is stable


  return (
    // Optional: <div className={styles.readerContainer}>
    <div>
      <h2>Bible Reader</h2>
      <PassageSelector onPassageChange={handlePassageChange} />
      <BibleTextDisplay passage={selectedPassage} />
    </div>
  );
}

export default BibleReaderPage;