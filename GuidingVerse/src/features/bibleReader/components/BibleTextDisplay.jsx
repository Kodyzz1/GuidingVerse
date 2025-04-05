// src/features/bibleReader/components/BibleTextDisplay.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify'; // <-- Import DOMPurify

function BibleTextDisplay({ passage }) {
  // Store the array of verses instead of a single formatted string
  const [versesData, setVersesData] = useState([]); // <-- Changed state name and initial value
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Configuration for DOMPurify - Allow only <i> tags (and maybe <b>)
  const sanitizeConfig = {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['i', 'b'], // <-- Adjust allowed tags as needed
    ALLOWED_ATTR: [] // <-- Disallow attributes for safety
  };

  useEffect(() => {
    if (passage.book && passage.chapter) {
      const loadText = async () => {
        setIsLoading(true);
        setError('');
        setVersesData([]); // <-- Clear previous verses on new load
        const encodedBook = encodeURIComponent(passage.book);
        const apiUrl = `/api/bible/kjv/${encodedBook}/${passage.chapter}`;

        console.log(`Workspaceing from backend: ${apiUrl}`); // For debugging

        try {
          const response = await fetch(apiUrl);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          // --- Store the verses array directly ---
          if (Array.isArray(data?.verses)) {
            setVersesData(data.verses); // <-- Store the array
          } else {
             throw new Error("Invalid data format received from API.");
          }
          // ----------------------------------------

        } catch (err) {
          console.error("Error fetching or processing Bible text:", err);
          setError(`Failed to load text: ${err.message}`);
          setVersesData([]); // <-- Clear verses on error
        } finally {
          setIsLoading(false);
        }
      };
      loadText();
    } else {
      setVersesData([]); // Clear verses if passage is invalid
    }
  // Update dependency array if needed, book and chapter are correct here
  }, [passage.book, passage.chapter]);


  // --- Updated Render Logic ---
  if (!passage.book || !passage.chapter) {
    return <div>Please select a book and chapter above.</div>;
  }
  if (isLoading) {
    return <div>Loading text for {passage.book} {passage.chapter}...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  // Render each verse by mapping over the versesData array
  return (
    <div style={{ marginTop: '1rem', border: '1px solid lightgray', padding: '1rem' }}>
      <h3>{passage.book} - Chapter {passage.chapter}</h3>
      {versesData.length > 0 ? (
         versesData.map(verse => (
           // Use a paragraph or div for each verse for block display
           <p key={verse.verse} style={{ marginBottom: '0.5em' }}> {/* Added margin for spacing */}
             <strong>{verse.verse}.</strong>{' '} {/* Verse number */}
             {/* Sanitize and render verse text as HTML */}
             <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text, sanitizeConfig) }} />
           </p>
         ))
      ) : (
        // Handle case where verses array is empty but no error/loading
        <div>No text found for this passage.</div>
      )}
    </div>
  );
}

BibleTextDisplay.propTypes = {
  passage: PropTypes.shape({
    book: PropTypes.string,
    chapter: PropTypes.number,
    // Add 'verse' prop if it's used, but it seems derived from the fetch
  }).isRequired,
};

export default BibleTextDisplay;