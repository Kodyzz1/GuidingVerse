// src/features/bibleReader/pages/BibleReaderPage.jsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PassageSelector from '../components/PassageSelector';
import BibleTextDisplay from '../components/BibleTextDisplay';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleReaderPage.module.css';

function BibleReaderPage() {
  // --- Router Hooks ---
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // --- Refs ---
  const historyRef = useRef(null);
  const settingsRef = useRef(null);

  // --- State (Passage Selection from URL or Defaults) ---
  const bookParam = searchParams.get('book');
  const chapterParam = searchParams.get('chapter');
  const isValidBook = bookParam && BIBLE_BOOKS.includes(bookParam);
  const defaultBook = isValidBook ? bookParam : 'Genesis';
  const maxChapters = BIBLE_CHAPTER_COUNTS[defaultBook] || 1;
  const chapterNumber = chapterParam ? parseInt(chapterParam, 10) : 1;
  const isValidChapter = chapterNumber && !isNaN(chapterNumber) && chapterNumber > 0 && chapterNumber <= maxChapters;
  const defaultChapter = isValidChapter ? chapterNumber : 1;

  const [selectedPassage, setSelectedPassage] = useState({
    book: defaultBook,
    chapter: defaultChapter,
  });

  // --- State (Reader Settings) ---
  const [settings, setSettings] = useState({
    fontSize: 'medium',
    lineSpacing: 'normal',
    showVerseNumbers: true,
    showNextPrevButtons: true,
    showSettings: false
  });

  // --- State (Reading History) ---
  const [recentPassages, setRecentPassages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Effects ---
  // Handle click outside dropdown menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setShowHistory(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettings(prev => ({ ...prev, showSettings: false }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update URL and reading history when passage changes
  useEffect(() => {
    setSearchParams({ book: selectedPassage.book, chapter: selectedPassage.chapter });

    if (isAuthenticated && selectedPassage.book && selectedPassage.chapter) {
      const newPassage = {
        book: selectedPassage.book,
        chapter: selectedPassage.chapter,
        timestamp: new Date().toISOString()
      };
      setRecentPassages(prev => {
        const filtered = prev.filter(p => !(p.book === newPassage.book && p.chapter === newPassage.chapter));
        return [newPassage, ...filtered].slice(0, 10); // Keep last 10
      });
      // TODO: Persist reading history to backend
    }
  }, [selectedPassage, setSearchParams, isAuthenticated]);

  // --- Handlers ---
  const handlePassageChange = useCallback((newPassage) => {
    setSelectedPassage(newPassage);
  }, []);

  const goToNextChapter = () => {
    const currentBook = selectedPassage.book;
    const currentChapter = selectedPassage.chapter;
    const maxChaptersForBook = BIBLE_CHAPTER_COUNTS[currentBook] || 1;

    if (currentChapter < maxChaptersForBook) {
      setSelectedPassage({ book: currentBook, chapter: currentChapter + 1 });
    } else {
      const currentBookIndex = BIBLE_BOOKS.indexOf(currentBook);
      if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        setSelectedPassage({ book: nextBook, chapter: 1 });
      }
    }
  };

  const goToPreviousChapter = () => {
    const currentBook = selectedPassage.book;
    const currentChapter = selectedPassage.chapter;

    if (currentChapter > 1) {
      setSelectedPassage({ book: currentBook, chapter: currentChapter - 1 });
    } else {
      const currentBookIndex = BIBLE_BOOKS.indexOf(currentBook);
      if (currentBookIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
        const prevBookChapters = BIBLE_CHAPTER_COUNTS[prevBook] || 1;
        setSelectedPassage({ book: prevBook, chapter: prevBookChapters });
      }
    }
  };

  const updateSetting = (setting, value) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleHistoryClick = (passage) => {
    setSelectedPassage({ book: passage.book, chapter: passage.chapter });
    setShowHistory(false);
  };

  // --- Helpers ---
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // --- JSX Structure ---
  return (
    <div className={styles.readerContainer}>
      {/* --- Header & Toolbar --- */}
      <div className={styles.readerHeader}>
        <h1 className={styles.readerTitle}>Bible Reader</h1>

        <div className={styles.toolbarContainer}>
          <PassageSelector
            onPassageChange={handlePassageChange}
            initialBook={selectedPassage.book}
            initialChapter={selectedPassage.chapter}
          />

          <div className={styles.readerControls}>
            {/* History button */}
            {isAuthenticated && (
              <div className={styles.historyDropdown} ref={historyRef}>
                <button
                  className={styles.historyButton}
                  onClick={() => setShowHistory(!showHistory)}
                  aria-label="Reading History"
                  title="Reading History"
                >
                  <span className={styles.iconHistory}>⏱</span>
                </button>

                {showHistory && (
                  <div className={styles.historyMenu}>
                    <h3 className={styles.historyTitle}>Recent Passages</h3>
                    {recentPassages.length > 0 ? (
                      <ul className={styles.historyList}>
                        {recentPassages.map((passage, index) => (
                          <li key={index} className={styles.historyItem}>
                            <button
                              onClick={() => handleHistoryClick(passage)}
                              className={styles.historyItemButton}
                            >
                              <span className={styles.historyPassage}>
                                {passage.book} {passage.chapter}
                              </span>
                              <span className={styles.historyTime}>
                                {formatDate(passage.timestamp)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.historyEmpty}>No reading history yet</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings button */}
            <div className={styles.settingsDropdown} ref={settingsRef}>
              <button
                className={styles.settingsButton}
                onClick={() => setSettings(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                aria-label="Reader Settings"
                title="Reader Settings"
              >
                <span className={styles.iconSettings}>⚙️</span>
              </button>

              {settings.showSettings && (
                <div className={styles.settingsMenu}>
                  <h3 className={styles.settingsTitle}>Reader Settings</h3>
                  <div className={styles.settingItem}>
                    <label htmlFor="fontSize">Font Size:</label>
                    <select
                      id="fontSize"
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value)}
                      className={styles.settingsSelect}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="xlarge">X-Large</option>
                    </select>
                  </div>
                  <div className={styles.settingItem}>
                    <label htmlFor="lineSpacing">Line Spacing:</label>
                    <select
                      id="lineSpacing"
                      value={settings.lineSpacing}
                      onChange={(e) => updateSetting('lineSpacing', e.target.value)}
                      className={styles.settingsSelect}
                    >
                      <option value="compact">Compact</option>
                      <option value="normal">Normal</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>
                  <div className={styles.settingItemCheckbox}>
                    <input
                      type="checkbox"
                      id="showVerseNumbers"
                      checked={settings.showVerseNumbers}
                      onChange={(e) => updateSetting('showVerseNumbers', e.target.checked)}
                      className={styles.settingsCheckbox}
                    />
                    <label htmlFor="showVerseNumbers">Show Verse Numbers</label>
                  </div>
                  <div className={styles.settingItemCheckbox}>
                    <input
                      type="checkbox"
                      id="showNextPrevButtons"
                      checked={settings.showNextPrevButtons}
                      onChange={(e) => updateSetting('showNextPrevButtons', e.target.checked)}
                      className={styles.settingsCheckbox}
                    />
                    <label htmlFor="showNextPrevButtons">Show Prev/Next Buttons</label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className={styles.mainContent}>
        <div className={styles.textDisplayContainer}>
          <BibleTextDisplay 
            passage={selectedPassage} 
            key={`${selectedPassage.book}-${selectedPassage.chapter}`}
          />
        </div>
      </div>

      {/* --- Navigation Buttons (Optional) --- */}
      {settings.showNextPrevButtons && (
        <div className={styles.navigationButtons}>
          <button onClick={goToPreviousChapter} className={styles.navButton}>&larr; Previous</button>
          <button onClick={goToNextChapter} className={styles.navButton}>Next &rarr;</button>
        </div>
      )}
    </div>
  );
}

export default BibleReaderPage;