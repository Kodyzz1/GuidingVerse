import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleTextDisplay.module.css';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner';

function BibleTextDisplay({ passage }) {
  // State for Bible verses
  const [versesData, setVersesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get user data for denomination-aware AI interpretation
  const { user } = useAuth();

  // State for verse highlighting
  const [highlightedVerses, setHighlightedVerses] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartVerse, setSelectionStartVerse] = useState(null);
  
  // State for AI interpretation
  const [isInterpretationLoading, setIsInterpretationLoading] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [showInterpretation, setShowInterpretation] = useState(false);

  // Ref for verses container (click-away detection)
  const versesContainerRef = useRef(null);

  // DOMPurify configuration
  const sanitizeConfig = {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: ['i', 'b', 'em', 'strong'], 
    ALLOWED_ATTR: [] 
  };

  // Click-away handler
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

  // Fetch Bible text
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
          console.error("Error fetching or processing Bible text:", err);
          setError(`Failed to load text: ${err.message}`);
          setVersesData([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadText();
      
      // Clear any previous highlights when changing passages
      setHighlightedVerses([]);
      setInterpretation(null);
      setShowInterpretation(false);
    }
  }, [passage.book, passage.chapter]);

  // Handle verse selection for highlighting
  const handleVerseClick = (verseNum) => {
    if (!isSelecting) {
      // Start verse selection
      setIsSelecting(true);
      setSelectionStartVerse(verseNum);
      setHighlightedVerses([verseNum]);
    } else {
      // Complete verse selection
      setIsSelecting(false);
      
      // Calculate verses in range (handle both forward and backward selection)
      const start = Math.min(selectionStartVerse, verseNum);
      const end = Math.max(selectionStartVerse, verseNum);
      
      const selectedVerses = [];
      for (let i = start; i <= end; i++) {
        selectedVerses.push(i);
      }
      
      setHighlightedVerses(selectedVerses);
      
      // Automatically get interpretation
      getAIInterpretation(selectedVerses);
    }
  };

  // Handle keyboard navigation for verse selection
  const handleVerseKeyDown = (e, verseNum) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleVerseClick(verseNum);
    }
  };

  // Clear selection if Escape is pressed
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && isSelecting) {
      setIsSelecting(false);
      setHighlightedVerses([]);
    }
  };

  // Get AI interpretation
  const getAIInterpretation = async (verses) => {
    if (!verses || verses.length === 0) return;
    
    setIsInterpretationLoading(true);
    setShowInterpretation(true);
    
    try {
      const selectedText = verses
        .map(verseNum => {
          const verse = versesData.find(v => v.verse === verseNum);
          return verse ? `${verseNum}. ${verse.text}` : '';
        })
        .filter(Boolean)
        .join(' ');
      
      const reference = `${passage.book} ${passage.chapter}:${verses[0]}${verses.length > 1 ? `-${verses[verses.length - 1]}` : ''}`;
      
      // Simulated API call
      setTimeout(() => {
        const userDenomination = user?.denomination || 'Non-denominational';
        setInterpretation({
          text: selectedText,
          reference,
          interpretation: getMockInterpretation(reference, userDenomination),
          timestamp: new Date().toISOString()
        });
        setIsInterpretationLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error getting interpretation:', error);
      setInterpretation({
        error: 'Failed to get interpretation. Please try again.'
      });
      setIsInterpretationLoading(false);
    }
  };

  // Close interpretation panel
  const handleCloseInterpretation = () => {
    setShowInterpretation(false);
  };

  // Save interpretation
  const handleSaveInterpretation = () => {
    if (!interpretation) return;
    
    try {
      const interpretationId = `interp_${Date.now()}`;
      const entryToSave = {
        id: interpretationId,
        userId: user?.id || 'anonymous',
        ...interpretation
      };
      
      const existingSaved = localStorage.getItem('savedInterpretations');
      const savedInterpretations = existingSaved 
        ? JSON.parse(existingSaved) 
        : [];
      
      savedInterpretations.push(entryToSave);
      localStorage.setItem('savedInterpretations', JSON.stringify(savedInterpretations));
      alert('Interpretation saved successfully!');
    } catch (error) {
      console.error('Error saving interpretation:', error);
      alert('Failed to save interpretation. Please try again.');
    }
  };

  // Mock interpretation function with HTML tags
  const getMockInterpretation = (reference, denomination) => {
    const interpretations = {
      'Baptist': `From a Baptist perspective, <i>${reference}</i> emphasizes the personal relationship with Christ and the importance of faith alone for salvation. This passage calls believers to personal accountability in their walk with God.`,
      
      'Catholic': `In Catholic tradition, <i>${reference}</i> connects to the Church's teaching on grace and works. The Catechism relates this passage to our participation in God's divine plan through both faith and obedient action.`,
      
      'Methodist': `Methodist theology sees <i>${reference}</i> as highlighting God's prevenient grace that draws us toward salvation. This reflects Wesley's emphasis on personal holiness and social responsibility as responses to God's grace.`,
      
      'Non-denominational': `This passage in <i>${reference}</i> emphasizes core Christian principles about God's love and our response as believers. It reminds us of the universal call to follow Christ's teachings in our daily lives.`,
      
      'Presbyterian': `From a Reformed/Presbyterian perspective, <i>${reference}</i> reflects God's sovereignty and the covenant relationship He establishes with believers. This reinforces the doctrines of grace that emphasize God's initiative in salvation.`,
      
      'default': `<i>${reference}</i> contains timeless wisdom that speaks to believers across Christian traditions. Its message resonates with fundamental truths about God's character and His relationship with humanity.`
    };
    
    return interpretations[denomination] || interpretations.default;
  };

  if (!passage.book || !passage.chapter) {
    return <div className={styles.placeholder}>Please select a book and chapter above.</div>;
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

  // Handle interpretation content rendering
  let interpretationContent;
  
  if (isInterpretationLoading) {
    interpretationContent = (
      <div className={styles.interpretationLoading}>
        <LoadingSpinner size="small" message="Getting interpretation..." />
      </div>
    );
  } else if (interpretation) {
    interpretationContent = (
      <div className={styles.interpretationContent}>
        <div className={styles.selectedVerses}>
          <h5>Selected Passage:</h5>
          <blockquote 
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(interpretation.text, sanitizeConfig) 
            }} 
          />
        </div>
        
        <div className={styles.denominationInterpretation}>
          <h5>{user?.denomination || 'Christian'} Perspective:</h5>
          <p
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(interpretation.interpretation, sanitizeConfig)
            }}
          />
          
          {interpretation.error && (
            <p className={styles.interpretationError}>{interpretation.error}</p>
          )}
        </div>
        
        <div className={styles.interpretationActions}>
          <button 
            className={styles.actionButton}
            onClick={handleCloseInterpretation}
          >
            Close
          </button>
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={handleSaveInterpretation}
          >
            Save Interpretation
          </button>
        </div>
      </div>
    );
  } else {
    interpretationContent = (
      <div className={styles.interpretationError}>
        <p>Could not load interpretation. Please try again.</p>
        <button 
          className={styles.actionButton}
          onClick={handleCloseInterpretation}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <main className={styles.bibleTextContainer} onKeyDown={handleKeyDown}>
      <h2 className={styles.passageTitle}>{passage.book} - Chapter {passage.chapter}</h2>
      
      <aside className={styles.instructionBox}>
        <p>Click or press Enter on a verse to start highlighting. Then click or press Enter on another verse to highlight a range.</p>
        <p>The AI will provide an interpretation based on your selected denomination ({user?.denomination || 'Not specified'}).</p>
      </aside>
      
      <div className={styles.versesContainer} ref={versesContainerRef}>
        {versesData.length > 0 ? (
          versesData.map(verse => (
            <button 
              key={verse.verse} 
              className={`
                ${styles.verseButton}
                ${highlightedVerses.includes(verse.verse) ? styles.highlighted : ''}
                ${isSelecting && verse.verse === selectionStartVerse ? styles.selectionStart : ''}
              `}
              onClick={() => handleVerseClick(verse.verse)}
              onKeyDown={(e) => handleVerseKeyDown(e, verse.verse)}
              aria-pressed={highlightedVerses.includes(verse.verse)}
              aria-label={`Verse ${verse.verse}`}
            >
              <span className={styles.verseNumber}>{verse.verse}.</span>
              <span 
                className={styles.verseText}
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(verse.text, sanitizeConfig) 
                }} 
              />
            </button>
          ))
        ) : (
          <div className={styles.noContent}>No text found for this passage.</div>
        )}
      </div>
      
      {showInterpretation && (
        <aside 
          className={styles.interpretationPanel} 
          aria-live="polite"
        >
          <header className={styles.interpretationHeader}>
            <h3>{interpretation?.reference || 'Loading interpretation...'}</h3>
            <button 
              onClick={handleCloseInterpretation} 
              className={styles.closeButton}
              aria-label="Close interpretation"
            >
              &times;
            </button>
          </header>
          
          {interpretationContent}
        </aside>
      )}
    </main>
  );
}

BibleTextDisplay.propTypes = {
  passage: PropTypes.shape({
    book: PropTypes.string,
    chapter: PropTypes.number,
  }).isRequired,
};

export default BibleTextDisplay;