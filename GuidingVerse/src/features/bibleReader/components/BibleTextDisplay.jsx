import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Optional: Create CSS module styles later
// import styles from './BibleTextDisplay.module.css';

// Mock function to simulate fetching text (replace later)
const fetchMockBibleText = async (book, chapter) => {
  console.log(`Mock fetch for: ${book} ${chapter}`);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
  // Return some placeholder text based on selection
  return `This is the placeholder text for ${book}, Chapter ${chapter}. Highlighting and AI features coming soon! Lorem ipsum dolor sit amet...`;
};


function BibleTextDisplay({ passage }) { // passage = { book: 'Genesis', chapter: 1 }
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch text when the passage prop changes
  useEffect(() => {
    if (passage.book && passage.chapter) {
      const loadText = async () => {
        setIsLoading(true);
        setError('');
        try {
          // --- Replace fetchMockBibleText with actual API call / data fetch later ---
          const fetchedText = await fetchMockBibleText(passage.book, passage.chapter);
          setText(fetchedText);
        } catch (err) {
          console.error("Error fetching Bible text:", err);
          setError("Failed to load Bible text.");
          setText(''); // Clear previous text on error
        } finally {
          setIsLoading(false);
        }
      };
      loadText();
    } else {
      // Clear text if passage is incomplete
      setText('');
    }
    // Dependency array includes properties of the passage object
  }, [passage.book, passage.chapter]);


  // Render logic
  if (!passage.book || !passage.chapter) {
    return <div>Please select a book and chapter.</div>;
  }

  if (isLoading) {
    return <div>Loading text for {passage.book} {passage.chapter}...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    // Optional: <div className={styles.textContainer}>
    <div style={{ marginTop: '1rem', border: '1px solid lightgray', padding: '1rem' }}>
      <h3>{passage.book} - Chapter {passage.chapter}</h3>
      {/* Add logic for highlighting/tooltips later */}
      <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
    </div>
  );
}

BibleTextDisplay.propTypes = {
  passage: PropTypes.shape({
    book: PropTypes.string,
    chapter: PropTypes.number,
  }).isRequired,
};

export default BibleTextDisplay;