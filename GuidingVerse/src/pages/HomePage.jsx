// --- Imports ---
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './HomePage.module.css';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

// --- Component Definition ---
function HomePage() {
  const { isAuthenticated } = useAuth();
  const [verseOfTheDay, setVerseOfTheDay] = useState(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [verseError, setVerseError] = useState(null);

  useEffect(() => {
    const fetchVerse = async () => {
      setIsLoadingVerse(true);
      setVerseError(null);
      try {
        const response = await fetch('/api/verse-of-the-day');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error ${response.status}`);
        }
        const data = await response.json();
        setVerseOfTheDay(data);
      } catch (error) {
        console.error("Error fetching verse of the day:", error);
        setVerseError(error.message || "Could not load verse of the day.");
        setVerseOfTheDay(null);
      } finally {
        setIsLoadingVerse(false);
      }
    };

    fetchVerse();
  }, []);

  // Define allowed tags for sanitization
  const sanitizeConfig = {
      ALLOWED_TAGS: ['i', 'em'], // Allow italics
      ALLOWED_ATTR: [] // No attributes allowed
  };

  // --- JSX Structure ---
  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Journey Through Scripture with GuidingVerse</h1>
          <p className={styles.heroSubtitle}>
            A modern Bible study companion designed for clarity, focus, and spiritual growth
          </p>
          <div className={styles.heroButtons}>
            {isAuthenticated ? (
              <Link to="/reader" className={styles.primaryButton}>Open Bible Reader</Link>
            ) : (
              <>
                <Link to="/signup" className={styles.primaryButton}>Start Your Journey</Link>
                <Link to="/reader" className={styles.secondaryButton}>Try Reader</Link>
              </>
            )}
          </div>
        </div>
      </section>
      {/* END Hero Section */}

      {/* --- MOVE Scripture of the Day Here --- */}
      <section className={styles.scriptureSection}>
        <h2 className={styles.sectionTitle}>Scripture of the Day</h2>
        <div className={styles.scriptureCard}>
          {isLoadingVerse ? (
            <p>Loading verse...</p>
          ) : verseError ? (
            <p className={styles.errorText}>{verseError}</p>
          ) : verseOfTheDay ? (
            <>
              <p 
                className={styles.scriptureText}
                dangerouslySetInnerHTML={{ 
                  __html: `&quot;${DOMPurify.sanitize(verseOfTheDay.text, sanitizeConfig)}&quot;` 
                }}
              />
              <p className={styles.scriptureReference}>
                — {verseOfTheDay.book} {verseOfTheDay.chapter}:{verseOfTheDay.verse} (KJV)
              </p>
            </>
          ) : (
            <p>Verse of the day not available.</p>
          )}
        </div>
      </section>
      {/* --- END Scripture of the Day --- */}
      
      {/* Features Overview Section (Why Choose GuidingVerse?) */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Why Choose GuidingVerse?</h2>
        
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📖</div>
            <h3>Clear Reading Experience</h3>
            <p>Distraction-free interface designed for comfortable reading of Scripture with proper formatting and verse navigation.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3>Simple Navigation</h3>
            <p>Easily find and navigate to any book, chapter, or verse with our intuitive selection tools.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔄</div>
            <h3>Sync Across Devices</h3>
            <p>Your reading progress, bookmarks, and notes sync seamlessly across all your devices.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✝️</div>
            <h3>Denomination Aware</h3>
            <p>Customize your experience based on your denomination for a more relevant study experience.</p>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section - REMOVED */}
      {/* 
      <section className={styles.testimonialsSection}>
        <h2 className={styles.sectionTitle}>What Our Users Say</h2>
        
        <div className={styles.testimonialsContainer}>
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>&quot;GuidingVerse has transformed my daily devotional time. The clean interface helps me focus on Scripture without distractions.&quot;</p>
            <p className={styles.testimonialAuthor}>— Sarah K.</p>
          </div>
          
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>&quot;I appreciate how GuidingVerse respects different denominational traditions while keeping the focus on Scripture itself.&quot;</p>
            <p className={styles.testimonialAuthor}>— Michael T.</p>
          </div>
          
          <div className={styles.testimonialCard}>
            <p className={styles.testimonialText}>&quot;The ability to access my Bible study notes across all my devices has been a game-changer for my small group leadership.&quot;</p>
            <p className={styles.testimonialAuthor}>— Pastor James</p>
          </div>
        </div>
      </section>
      */}
      
      {/* Getting Started Section */}
      <section className={styles.gettingStartedSection}>
        <h2 className={styles.sectionTitle}>Begin Your Scripture Journey Today</h2>
        <p className={styles.sectionSubtitle}>Create a free account to unlock the full GuidingVerse experience</p>
        
        <div className={styles.stepsContainer}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <h3>Create an Account</h3>
            <p>Sign up for free to save your preferences and progress</p>
          </div>
          
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <h3>Choose a Passage</h3>
            <p>Navigate to any book or chapter in the Bible</p>
          </div>
          
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <h3>Start Reading</h3>
            <p>Enjoy a clean, focused reading experience</p>
          </div>
        </div>
        
        <div className={styles.ctaContainer}>
          {isAuthenticated ? (
            <Link to="/reader" className={`${styles.primaryButton} ${styles.large}`}>Open Bible Reader</Link>
          ) : (
            <Link to="/signup" className={`${styles.primaryButton} ${styles.large}`}>Create Free Account</Link>
          )}
        </div>
      </section>
      
      {/* Future Features */}
      <section className={styles.comingSoonSection}>
        <h2 className={styles.sectionTitle}>Coming Soon</h2>
        
        <div className={styles.comingSoonGrid}>
          <div className={styles.comingSoonCard}>
            <h3>Study Notes</h3>
            <p>Add personal notes to verses and chapters</p>
          </div>
          
          <div className={styles.comingSoonCard}>
            <h3>Reading Plans</h3>
            <p>Follow guided reading plans for spiritual growth</p>
          </div>
          
          <div className={styles.comingSoonCard}>
            <h3>Verse Highlighting</h3>
            <p>Highlight and categorize important passages</p>
          </div>
          
          <div className={styles.comingSoonCard}>
            <h3>Additional Translations</h3>
            <p>More Bible translations coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;