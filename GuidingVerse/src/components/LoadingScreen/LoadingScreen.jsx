import { useState, useEffect } from 'react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './LoadingScreen.module.css';

function LoadingScreen() {
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    const fetchRandomVerse = async () => {
      try {
        const response = await fetch('/api/bible/random-verse');
        if (response.ok) {
          const data = await response.json();
          setVerse(data);
        }
      } catch (error) {
        console.error('Error fetching random verse:', error);
      }
    };

    fetchRandomVerse();
  }, []);

  return (
    <div className={styles.loadingScreen}>
      <LoadingSpinner fullPage={true} />
      {verse && (
        <div className={styles.verseContainer}>
          <p className={styles.reference}>
            {verse.book} {verse.chapter}:{verse.verse}
          </p>
          <p className={styles.text}>"{verse.text}"</p>
        </div>
      )}
    </div>
  );
}

export default LoadingScreen; 