import { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleTextDisplay.module.css';
import LoadingSpinner from '../../../components/LoadingSpinner/LoadingSpinner';

function BibleTextDisplay({ passage }) {
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
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectionStartVerse(verseNum);
      setHighlightedVerses([verseNum]);
    } else {
      setIsSelecting(false);
      const start = Math.min(selectionStartVerse, verseNum);
      const end = Math.max(selectionStartVerse, verseNum);
      const selectedVerses = [];
      for (let i = start; i <= end; i++) {
        selectedVerses.push(i);
      }
      setHighlightedVerses(selectedVerses);
      getAIInterpretation(selectedVerses);
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

  const getAIInterpretation = async (verses) => {
    if (!verses || verses.length === 0) return;
    setIsInterpretationLoading(true);
    setShowInterpretation(true);
    setInterpretation(null);

    try {
      const selectedText = verses
        .map(verseNum => {
          const verse = versesData.find(v => v.verse === verseNum);
          return verse ? `${verseNum}. ${verse.text}` : '';
        })
        .filter(Boolean)
        .join(' ');

      const reference = `${passage.book} ${passage.chapter}:${verses[0]}${verses.length > 1 ? `-${verses[verses.length - 1]}` : ''}`;

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
      setInterpretation({
        error: 'Failed to get interpretation. Please try again.'
      });
      setIsInterpretationLoading(false);
    }
  };

  const getMockInterpretation = (reference, denomination) => {
    const interpretations = {
      'Baptist': `From a Baptist perspective, <i>${reference}</i> emphasizes the personal relationship with Christ and the importance of faith alone for salvation. This passage calls believers to personal accountability in their walk with God.`,
      'Catholic': `In Catholic tradition, <i>${reference}</i> connects to the Church&apos;s teaching on grace and works. The Catechism relates this passage to our participation in God&apos;s divine plan through both faith and obedient action.`,
      'Methodist': `Methodist theology sees <i>${reference}</i> as highlighting God&apos;s prevenient grace that draws us toward salvation. This reflects Wesley&apos;s emphasis on personal holiness and social responsibility as responses to God&apos;s grace.`,
      'Non-denominational': `This passage in <i>${reference}</i> emphasizes core Christian principles about God&apos;s love and our response as believers. It reminds us of the universal call to follow Christ&apos;s teachings in our daily lives.`,
      'Presbyterian': `From a Reformed/Presbyterian perspective, <i>${reference}</i> reflects God&apos;s sovereignty and the covenant relationship He establishes with believers. This reinforces the doctrines of grace that emphasize God&apos;s initiative in salvation.`,
      'default': `<i>${reference}</i> contains timeless wisdom that speaks to believers across Christian traditions. Its message resonates with fundamental truths about God&apos;s character and His relationship with humanity.`
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

  let interpretationContent;
  if (isInterpretationLoading) {
    interpretationContent = <LoadingSpinner size="small" message="Getting interpretation..." />;
  } else if (interpretation?.error) {
    interpretationContent = <p className={styles.interpretationError}>{interpretation.error}</p>;
  } else if (interpretation) {
    interpretationContent = (
      <>
        <p><strong>Reference:</strong> {interpretation.reference}</p>
        <p><strong>Text:</strong> {interpretation.text}</p>
        <p><strong>Interpretation:</strong></p>
        <div
          className={styles.interpretationText}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(interpretation.interpretation, sanitizeConfig)
          }}
        />
        <button onClick={handleSaveInterpretation} className={styles.saveButton}>
          Save Interpretation
        </button>
      </>
    );
  }

  return (
    <div className={styles.container} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className={styles.versesContainer} ref={versesContainerRef}>
        {versesData.map((verse) => {
          const isHighlighted = highlightedVerses.includes(verse.verse);
          const isSelectionStart = verse.verse === selectionStartVerse;
          return (
            <span
              key={verse.verse}
              className={`${styles.verse} ${isHighlighted ? styles.highlighted : ''} ${isSelectionStart ? styles.selectionStart : ''}`}
              onClick={() => handleVerseClick(verse.verse)}
              onKeyDown={(e) => handleVerseKeyDown(e, verse.verse)}
              role="button"
              tabIndex={0}
              aria-pressed={isHighlighted}
              aria-label={`Verse ${verse.verse}`}
            >
              <sup className={styles.verseNumber}>{verse.verse}</sup>
              <span dangerouslySetInnerHTML={{
                 __html: DOMPurify.sanitize(verse.text, sanitizeConfig)
              }} />
              {' '}
            </span>
          );
        })}
      </div>

      {showInterpretation && (
        <div className={styles.interpretationPanel}>
          <div className={styles.interpretationHeader}>
            <h3>AI Interpretation</h3>
            <button onClick={handleCloseInterpretation} className={styles.closeButton} aria-label="Close Interpretation">
              &times;
            </button>
          </div>
          <div className={styles.interpretationBody}>
            {interpretationContent}
          </div>
        </div>
      )}
    </div>
  );
}

BibleTextDisplay.propTypes = {
  passage: PropTypes.shape({
    book: PropTypes.string.isRequired,
    chapter: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

export default BibleTextDisplay;