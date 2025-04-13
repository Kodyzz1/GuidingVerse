import { useEffect, useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleTextDisplay.module.css';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner';

// Define mappings for props to CSS values
const fontSizeMap = {
  small: '0.85em',
  medium: '1em',  // Default
  large: '1.2em',
  xlarge: '1.4em' 
};

const lineSpacingMap = {
  compact: 1.2,
  normal: 1.5, // Default
  relaxed: 1.8
};

function BibleTextDisplay({ passage, fontSize = 'medium', lineSpacing = 'normal', showVerseNumbers = true }) {
  const [versesData, setVersesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartVerse, setSelectionStartVerse] = useState(null);
  const [isInterpretationLoading, setIsInterpretationLoading] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [showInterpretation, setShowInterpretation] = useState(false);

  const { user } = useAuth();

  const versesContainerRef = useRef(null);

  const sanitizeConfig = {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['i', 'b', 'em', 'strong'],
    ALLOWED_ATTR: []
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        versesContainerRef.current &&
        !versesContainerRef.current.contains(event.target) &&
        isSelecting
      ) {
        setIsSelecting(false);
        setHighlightedVerses([]);
        setSelectionStartVerse(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSelecting]);

  useEffect(() => {
    if (passage.book && passage.chapter) {
      const loadText = async () => {
        setIsLoading(true);
        setError('');
        setVersesData([]);
        const encodedBook = encodeURIComponent(passage.book);
        const apiUrl = `/api/bible/kjv/${encodedBook}/${passage.chapter}`;

        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (Array.isArray(data?.verses)) {
            setVersesData(data.verses);
          } else {
            throw new Error("Invalid data format received from API.");
          }
        } catch (err) {
          setError(`Failed to load text: ${err.message}`);
          setVersesData([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadText();

      setHighlightedVerses([]);
      setInterpretation(null);
      setShowInterpretation(false);
    }
  }, [passage.book, passage.chapter]);

  const handleVerseClick = (verseNum) => {
    console.log(`--- handleVerseClick: Clicked verse ${verseNum} ---`);
    console.log('Before Click Logic:', { isSelecting, selectionStartVerse, highlightedVerses: [...highlightedVerses] });

    if (!isSelecting) {
      console.log('First click logic executing...');
      // Start selection
      setIsSelecting(true);
      setSelectionStartVerse(verseNum);
      setHighlightedVerses([verseNum]);
      // Log state *after* setting (note: state updates might not reflect immediately in console)
      console.log('After First Click Setters:', { isSelecting: true, selectionStartVerse: verseNum, highlightedVerses: [verseNum] });
    } else {
      console.log('Second click logic executing...');
      // Complete selection
      setIsSelecting(false);
      const start = Math.min(selectionStartVerse, verseNum);
      const end = Math.max(selectionStartVerse, verseNum);
      const selectedVerses = [];
      for (let i = start; i <= end; i++) {
        selectedVerses.push(i);
      }
      setHighlightedVerses(selectedVerses);
      console.log('Calculated Range:', { start, end, selectedVerses: [...selectedVerses] });
      console.log('After Second Click Setters:', { isSelecting: false, highlightedVerses: [...selectedVerses] });

      getVerseInterpretations(selectedVerses); // Trigger interpretation
      console.log('getVerseInterpretations triggered with:', selectedVerses);
    }
  };

  const handleVerseKeyDown = (e, verseNum) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleVerseClick(verseNum);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isSelecting) {
      setIsSelecting(false);
      setHighlightedVerses([]);
      setSelectionStartVerse(null);
    }
  };

  const handleCloseInterpretation = () => {
    setShowInterpretation(false);
    setHighlightedVerses([]);
    setSelectionStartVerse(null);
  };

  const handleSaveInterpretation = () => {
    if (!interpretation || interpretation.error) return;
    try {
      const interpretationId = `interp_${Date.now()}`;
      const entryToSave = {
        id: interpretationId,
        userId: user?.id || 'anonymous',
        ...interpretation
      };
      const existingSaved = localStorage.getItem('savedInterpretations');
      const savedInterpretations = existingSaved ? JSON.parse(existingSaved) : [];
      savedInterpretations.push(entryToSave);
      localStorage.setItem('savedInterpretations', JSON.stringify(savedInterpretations));
      alert('Interpretation saved successfully!');
    } catch (saveError) {
      alert('Failed to save interpretation. Please try again.');
    }
  };

  const getVerseInterpretations = async (verses) => {
    if (!verses || verses.length === 0) return;
    
    setIsInterpretationLoading(true);
    setShowInterpretation(true);
    setInterpretation(null); // Reset state

    const denomination = user?.denomination;
    let denominationQuery = '';
    if (denomination && denomination !== 'Prefer not to say') {
      denominationQuery = `?denomination=${encodeURIComponent(denomination)}`;
    }

    // --- Create fetch promises for each verse --- //
    const fetchPromises = verses.map(verseNum => {
      const reference = `${passage.book} ${passage.chapter}:${verseNum}`;
      const encodedReference = encodeURIComponent(reference);
      const apiUrl = `/api/interpret/${encodedReference}${denominationQuery}`;
      
      return fetch(apiUrl, { method: 'GET' })
        .then(async response => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = response.status === 404 
              ? (errorData.message || 'No interpretation found') 
              : (errorData.message || `API Error: ${response.status}`);
            throw { reference: reference, status: response.status, message: message, type: 'verse' }; 
          }
          return response.json(); 
        })
        .then(data => {
            // Add the original reference back for fulfilled promises
            return { ...data, reference: reference }; // Backend should provide type: 'verse'
        })
        .catch(error => {
            if (!error.reference) {
                error.reference = reference;
            }
            if (!error.type) { // Ensure type is set for errors
                error.type = 'verse';
            }
            throw error; 
        });
    });

    console.log(`Fetching verse interpretations for ${fetchPromises.length} verses...`);

    const results = await Promise.allSettled(fetchPromises);
    
    const interpretationResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return {
          type: result.value.type || 'verse', // Use type from response
          reference: result.value.reference, 
          interpretation: result.value.interpretation, 
          sourceDenomination: result.value.sourceDenomination,
          timestamp: new Date().toISOString()
        };
      } else {
        console.error('Error fetching verse interpretation:', result.reason?.reference, result.reason);
        return {
          type: result.reason?.type || 'verse',
          reference: result.reason?.reference || 'Unknown Verse Reference', 
          error: result.reason?.message || 'Failed to load interpretation.'
        };
      }
    });

    setInterpretation(interpretationResults); 
    setIsInterpretationLoading(false);
  };

  const getChapterSummary = async () => {
    setIsInterpretationLoading(true);
    setShowInterpretation(true);
    setInterpretation(null);

    const encodedBook = encodeURIComponent(passage.book);
    const encodedChapter = encodeURIComponent(passage.chapter);
    const denomination = user?.denomination;
    let denominationQuery = '';
    if (denomination && denomination !== 'Prefer not to say') {
      denominationQuery = `?denomination=${encodeURIComponent(denomination)}`;
    }

    const apiUrl = `/api/interpret/chapter/${encodedBook}/${encodedChapter}${denominationQuery}`;
    console.log('Fetching chapter summary from URL:', apiUrl);

    try {
      const response = await fetch(apiUrl, { method: 'GET' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error ${response.status}`);
      }
      const data = await response.json();
      setInterpretation(data); // Set state with the single summary object
    } catch (error) {
       console.error('Error fetching chapter summary:', error);
       setInterpretation({ 
         reference: `${passage.book} ${passage.chapter} (Chapter Summary)`, 
         type: 'chapter',
         error: error.message || 'Failed to load chapter summary.' 
       });
    } finally {
      setIsInterpretationLoading(false);
    }
  };

  const getBookSummary = async () => {
    setIsInterpretationLoading(true);
    setShowInterpretation(true);
    setInterpretation(null);

    const encodedBook = encodeURIComponent(passage.book);
    const denomination = user?.denomination;
    let denominationQuery = '';
    if (denomination && denomination !== 'Prefer not to say') {
      denominationQuery = `?denomination=${encodeURIComponent(denomination)}`;
    }

    const apiUrl = `/api/interpret/book/${encodedBook}${denominationQuery}`;
    console.log('Fetching book summary from URL:', apiUrl);

    try {
      const response = await fetch(apiUrl, { method: 'GET' });
       if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error ${response.status}`);
      }
      const data = await response.json();
      setInterpretation(data); // Set state with the single summary object
    } catch (error) {
       console.error('Error fetching book summary:', error);
       setInterpretation({ 
         reference: `${passage.book} (Book Summary)`, 
         type: 'book',
         error: error.message || 'Failed to load book summary.' 
       });
    } finally {
      setIsInterpretationLoading(false);
    }
  };

  const handleChapterClick = () => {
    console.log(`Chapter ${passage.chapter} clicked - fetching summary...`);
    getChapterSummary(); // Call the new function
  };

  const handleBookClick = () => {
    console.log(`Book ${passage.book} clicked - fetching summary...`);
    getBookSummary(); // Call the new function
  };

  // --- Conditional Rendering ---
  if (!passage.book || !passage.chapter) {
    // Handle cases where passage prop might be incomplete initially
    return <div className={styles.placeholder}>Please select a book and chapter.</div>;
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="medium" message={`Loading text for ${passage.book} ${passage.chapter}...`} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  // --- JSX Structure ---
  let interpretationContent;
  if (isInterpretationLoading) {
    interpretationContent = <LoadingSpinner size="small" message="Getting interpretation..." />;
  } 
  // Handle Array (Multiple Verses)
  else if (Array.isArray(interpretation)) {
    interpretationContent = interpretation.map((item, index) => (
      <div key={item.reference || index} className={styles.interpretationEntry}>
        <p><strong>Reference:</strong> {item.reference}</p>
        {item.error ? (
          <p className={styles.interpretationError}>{item.error}</p>
        ) : (
          <>
            {/* Display based on type - might be redundant if only verse errors exist here */}
            <p><strong>Interpretation ({item.sourceDenomination || 'Unknown'}):</strong></p>
            <div
              className={styles.interpretationText}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(item.interpretation || '', sanitizeConfig)
              }}
            />
          </>
        )}
      </div>
    ));
  } 
  // Handle Single Object (Book/Chapter Summary or Error)
  else if (interpretation && typeof interpretation === 'object' && !Array.isArray(interpretation)) {
    interpretationContent = (
      <div className={styles.interpretationEntry}> {/* Use same class for consistency? */}
        <p><strong>Reference:</strong> {interpretation.reference}</p>
        {interpretation.error ? (
           <p className={styles.interpretationError}>{interpretation.error}</p>
        ) : (
          <>
            <p><strong>{interpretation.type === 'book' ? 'Book' : 'Chapter'} Summary ({interpretation.sourceDenomination || 'Unknown'}):</strong></p>
            <div
              className={styles.interpretationText}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(interpretation.interpretation || '', sanitizeConfig)
              }}
            />
          </>
        )}
      </div>
    );
  }
  // Handle case where loading finished but interpretation is null/empty
  else if (!isInterpretationLoading && !interpretation) {
     interpretationContent = <p>No interpretation loaded.</p>; 
  }

  // --- Interpretation Panel Structure ---
  const interpretationPanel = (
    <div className={`${styles.interpretationPanel} ${showInterpretation ? styles.panelVisible : ''}`}>
      <div className={styles.panelHeader}>
        <h3>Interpretation</h3>
        <button onClick={handleCloseInterpretation} className={styles.closeButton} aria-label="Close interpretation panel">
          &times;
        </button>
      </div>
      <div 
        className={styles.panelContent} 
        style={{ 
            fontSize: fontSizeMap[fontSize] || fontSizeMap.medium,
            lineHeight: lineSpacingMap[lineSpacing] || lineSpacingMap.normal
        }}
      >
          {interpretationContent}
      </div>
    </div>
  );

  // --- Main Render --- //
  return (
    <div className={styles.bibleTextContainer}>
      <div className={styles.passageHeader}>
          <span 
            className={styles.bookTitle}
            onClick={handleBookClick}
            role="button"
            tabIndex={0}
            aria-label={`Interpret book ${passage.book}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBookClick(); }}
          >
            {passage.book}
          </span>
          <span 
            className={styles.chapterNumber}
            onClick={handleChapterClick}
            role="button"
            tabIndex={0}
            aria-label={`Interpret chapter ${passage.chapter}`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleChapterClick(); }}
          >
            {passage.chapter}
          </span>
      </div>

      <div 
        ref={versesContainerRef} 
        className={styles.versesContainer} 
        style={{ 
          fontSize: fontSizeMap[fontSize] || fontSizeMap.medium,
          lineHeight: lineSpacingMap[lineSpacing] || lineSpacingMap.normal
        }}
        onKeyDown={handleKeyDown} 
        tabIndex={-1}
      >
        {versesData.map((verse) => {
          const isHighlighted = highlightedVerses.includes(verse.verse);
          const isSelectionStart = verse.verse === selectionStartVerse;
          return (
            // Use span for inline flow, but make it behave like a button
            <span
              key={verse.verse}
              className={`${styles.verse} ${isHighlighted ? styles.highlighted : ''} ${isSelectionStart ? styles.selectionStart : ''}`}
              onClick={() => handleVerseClick(verse.verse)}
              onKeyDown={(e) => handleVerseKeyDown(e, verse.verse)}
              role="button"
              tabIndex={0} // Make it focusable
              aria-pressed={isHighlighted}
              aria-label={`Verse ${verse.verse}`}
            >
              {showVerseNumbers && <sup className={styles.verseNumber}>{verse.verse}</sup>}
              {/* Sanitize verse text allowing basic formatting */}
              <span 
                className={styles.verseText}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(verse.text, sanitizeConfig)
                }}
              />
              {' '}{/* Add space between verses */}
            </span>
          );
        })}
        {versesData.length === 0 && !isLoading && (
            <div className={styles.noContent}>No text available for this chapter.</div>
        )}
      </div>

      {interpretationPanel}
    </div>
  );
}

// --- Prop Types ---
BibleTextDisplay.propTypes = {
  passage: PropTypes.shape({
    book: PropTypes.string.isRequired,
    chapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  fontSize: PropTypes.string,
  lineSpacing: PropTypes.string,
  showVerseNumbers: PropTypes.bool
};

export default BibleTextDisplay;