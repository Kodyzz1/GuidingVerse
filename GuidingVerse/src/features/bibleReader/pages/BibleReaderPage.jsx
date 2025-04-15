// src/features/bibleReader/pages/BibleReaderPage.jsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PassageSelector from '../components/PassageSelector';
import BibleTextDisplay from '../components/BibleTextDisplay';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleReaderPage.module.css';

function BibleReaderPage() {
  // --- Router Hooks ---
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, setBookmark } = useAuth();

  // --- Refs ---
  const historyRef = useRef(null);
  const settingsRef = useRef(null);

  // --- State (Passage Selection from URL or Defaults) ---
  const [selectedPassage, setSelectedPassage] = useState(() => {
    const bookParam = searchParams.get('book');
    const chapterParam = searchParams.get('chapter');

    // 1. Prioritize URL parameters
    if (bookParam && BIBLE_BOOKS.includes(bookParam) && chapterParam && !isNaN(parseInt(chapterParam))) {
      const chapterNum = parseInt(chapterParam);
      if (chapterNum > 0 && chapterNum <= BIBLE_CHAPTER_COUNTS[bookParam]) {
        return { book: bookParam, chapter: chapterNum };
      }
    }

    // 2. Use user's last read location if logged in and no valid URL params
    if (isAuthenticated && user && user.lastReadBook && user.lastReadChapter) {
      if (BIBLE_BOOKS.includes(user.lastReadBook) && user.lastReadChapter > 0 && user.lastReadChapter <= BIBLE_CHAPTER_COUNTS[user.lastReadBook]) {
        console.log('Using last read location from user:', user.lastReadBook, user.lastReadChapter);
        return { book: user.lastReadBook, chapter: user.lastReadChapter };
      }
    }

    // 3. Default to Genesis 1
    console.log('Defaulting to Genesis 1');
    return { book: 'Genesis', chapter: 1 };
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
    window.scrollTo(0, 0);

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

  // --- Fetch interpretation data ---
  useEffect(() => {
    // ... existing fetch logic ...
  }, [selectedPassage]); // Re-fetch when passage changes

  // --- Update URL and SAVE last read location ---
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('book', selectedPassage.book);
    params.set('chapter', selectedPassage.chapter.toString());
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });

    // --- SAVE to backend IF authenticated ---
    const saveLastRead = async () => {
      if (isAuthenticated && user) {
        console.log('Saving last read:', selectedPassage.book, selectedPassage.chapter);
        try {
          const token = localStorage.getItem('guidingVerseToken'); // Assuming token is stored here
          if (!token) {
              console.warn('No token found, cannot save last read.');
              return;
          }

          const response = await fetch('/api/auth/last-read', { // Use the correct backend endpoint
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              book: selectedPassage.book,
              chapter: selectedPassage.chapter
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to save last read location:', response.status, errorData.message);
            // Handle specific errors if needed (e.g., 401 Unauthorized -> maybe logout?)
          } else {
            console.log('Last read location saved successfully.');
            // Optionally update user state in context if needed, though not strictly required here
          }
        } catch (error) {
          console.error('Error saving last read location:', error);
        }
      }
    };

    // Call the save function (consider debouncing if needed for rapid navigation)
    saveLastRead();

  }, [selectedPassage, navigate, location.pathname, isAuthenticated, user]); // Add isAuthenticated and user as dependencies

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

  // --- NEW: Bookmark Handler ---
  const handleBookmarkClick = async () => {
    if (!selectedPassage || !setBookmark) {
      return;
    }
    const success = await setBookmark(selectedPassage.book, selectedPassage.chapter);
    if (success) {
      // Optionally show a brief confirmation message to the user
      alert('Bookmark saved!'); 
    } else {
      // Optionally show an error message
      alert('Failed to save bookmark.');
    }
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
            {/* --- NEW: Bookmark Button --- */}
            {isAuthenticated && (
              <button
                className={`${styles.controlButton} ${styles.bookmarkButton}`}
                onClick={handleBookmarkClick}
                aria-label="Bookmark this chapter"
                title="Bookmark this chapter"
              >
                <span className={styles.iconBookmark}>&#x1F516;</span> {/* Bookmark icon */} 
              </button>
            )}

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
            fontSize={settings.fontSize}
            lineSpacing={settings.lineSpacing}
            showVerseNumbers={settings.showVerseNumbers}
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