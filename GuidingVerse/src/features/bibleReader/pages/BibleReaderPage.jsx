// src/features/bibleReader/pages/BibleReaderPage.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PassageSelector from '../components/PassageSelector';
import BibleTextDisplay from '../components/BibleTextDisplay';
import { BIBLE_BOOKS, BIBLE_CHAPTER_COUNTS } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './BibleReaderPage.module.css';

function BibleReaderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Refs for dropdown menus
  const historyRef = useRef(null);
  const settingsRef = useRef(null);
  
  // Get book and chapter from URL params, or use defaults
  const bookParam = searchParams.get('book');
  const chapterParam = searchParams.get('chapter');
  
  // Check if the book from URL is valid
  const isValidBook = bookParam && BIBLE_BOOKS.includes(bookParam);
  const defaultBook = isValidBook ? bookParam : 'Genesis';
  
  // Check if the chapter from URL is valid for the selected book
  const maxChapters = BIBLE_CHAPTER_COUNTS[defaultBook] || 1;
  const chapterNumber = chapterParam ? parseInt(chapterParam, 10) : 1;
  const isValidChapter = chapterNumber && !isNaN(chapterNumber) && chapterNumber > 0 && chapterNumber <= maxChapters;
  const defaultChapter = isValidChapter ? chapterNumber : 1;

  // State to hold the currently selected passage
  const [selectedPassage, setSelectedPassage] = useState({
    book: defaultBook,
    chapter: defaultChapter,
  });

  // State for reader settings
  const [settings, setSettings] = useState({
    fontSize: 'medium',
    lineSpacing: 'normal',
    showVerseNumbers: true,
    showNextPrevButtons: true,
    showSettings: false
  });

  // State for reader history
  const [recentPassages, setRecentPassages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Handle click outside for dropdown menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close history dropdown if click outside
      if (historyRef.current && !historyRef.current.contains(event.target)) {
        setShowHistory(false);
      }
      
      // Close settings dropdown if click outside
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettings(prev => ({ ...prev, showSettings: false }));
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Remove event listener on cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update URL when passage changes
  useEffect(() => {
    setSearchParams({ 
      book: selectedPassage.book, 
      chapter: selectedPassage.chapter 
    });
    
    // Add to reading history (if authenticated)
    if (isAuthenticated && selectedPassage.book && selectedPassage.chapter) {
      const newPassage = {
        book: selectedPassage.book,
        chapter: selectedPassage.chapter,
        timestamp: new Date().toISOString()
      };
      
      // Add to start of array and remove duplicates
      setRecentPassages(prev => {
        const filtered = prev.filter(
          p => !(p.book === newPassage.book && p.chapter === newPassage.chapter)
        );
        return [newPassage, ...filtered].slice(0, 10); // Keep only last 10
      });
      
      // In a real app, you'd also save this to user profile/backend
    }
  }, [selectedPassage, setSearchParams, isAuthenticated]);

  // Callback function to update the passage state from the selector
  const handlePassageChange = useCallback((newPassage) => {
    setSelectedPassage(newPassage);
  }, []);

  // Handle navigation to next/previous chapter
  const goToNextChapter = () => {
    const currentBook = selectedPassage.book;
    const currentChapter = selectedPassage.chapter;
    const maxChapters = BIBLE_CHAPTER_COUNTS[currentBook] || 1;
    
    if (currentChapter < maxChapters) {
      // Go to next chapter in same book
      setSelectedPassage({
        book: currentBook,
        chapter: currentChapter + 1
      });
    } else {
      // Go to first chapter of next book
      const currentBookIndex = BIBLE_BOOKS.indexOf(currentBook);
      if (currentBookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[currentBookIndex + 1];
        setSelectedPassage({
          book: nextBook,
          chapter: 1
        });
      }
    }
  };
  
  const goToPreviousChapter = () => {
    const currentBook = selectedPassage.book;
    const currentChapter = selectedPassage.chapter;
    
    if (currentChapter > 1) {
      // Go to previous chapter in same book
      setSelectedPassage({
        book: currentBook,
        chapter: currentChapter - 1
      });
    } else {
      // Go to last chapter of previous book
      const currentBookIndex = BIBLE_BOOKS.indexOf(currentBook);
      if (currentBookIndex > 0) {
        const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
        const prevBookChapters = BIBLE_CHAPTER_COUNTS[prevBook] || 1;
        setSelectedPassage({
          book: prevBook,
          chapter: prevBookChapters
        });
      }
    }
  };

  // Handle settings changes
  const updateSetting = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Handle clicking on a passage in the history
  const handleHistoryClick = (passage) => {
    setSelectedPassage({
      book: passage.book,
      chapter: passage.chapter
    });
    setShowHistory(false);
  };

  // Format date for history items
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={styles.readerContainer}>
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
                  
                  <div className={styles.settingGroup}>
                    <label htmlFor="fontSize" className={styles.settingLabel}>Text Size:</label>
                    <select 
                      id="fontSize"
                      value={settings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value)}
                      className={styles.settingSelect}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="x-large">Extra Large</option>
                    </select>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label htmlFor="lineSpacing" className={styles.settingLabel}>Line Spacing:</label>
                    <select 
                      id="lineSpacing"
                      value={settings.lineSpacing}
                      onChange={(e) => updateSetting('lineSpacing', e.target.value)}
                      className={styles.settingSelect}
                    >
                      <option value="tight">Tight</option>
                      <option value="normal">Normal</option>
                      <option value="relaxed">Relaxed</option>
                      <option value="loose">Loose</option>
                    </select>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label className={styles.settingCheckboxLabel}>
                      <input 
                        type="checkbox"
                        checked={settings.showVerseNumbers}
                        onChange={(e) => updateSetting('showVerseNumbers', e.target.checked)}
                        className={styles.settingCheckbox}
                      />
                      Show verse numbers
                    </label>
                  </div>
                  
                  <div className={styles.settingGroup}>
                    <label className={styles.settingCheckboxLabel}>
                      <input 
                        type="checkbox"
                        checked={settings.showNextPrevButtons}
                        onChange={(e) => updateSetting('showNextPrevButtons', e.target.checked)}
                        className={styles.settingCheckbox}
                      />
                      Show navigation buttons
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className={`${styles.textContainer} ${styles['fontSize-' + settings.fontSize]} ${styles['lineSpacing-' + settings.lineSpacing]}`}
      >
        <BibleTextDisplay 
          passage={selectedPassage} 
          showVerseNumbers={settings.showVerseNumbers}
        />
        
        {settings.showNextPrevButtons && (
          <div className={styles.navigationButtons}>
            <button 
              onClick={goToPreviousChapter}
              className={`${styles.navButton} ${styles.prevButton}`}
              title="Previous Chapter"
            >
              ← Previous Chapter
            </button>
            
            <button 
              onClick={goToNextChapter}
              className={`${styles.navButton} ${styles.nextButton}`}
              title="Next Chapter"
            >
              Next Chapter →
            </button>
          </div>
        )}
      </div>
      
      {!isAuthenticated && (
        <div className={styles.signupPrompt}>
          <p>Sign up for a free account to track your reading progress and access additional features!</p>
          <button 
            onClick={() => navigate('/signup')}
            className={styles.signupButton}
          >
            Create Account
          </button>
        </div>
      )}
    </div>
  );
}

export default BibleReaderPage;