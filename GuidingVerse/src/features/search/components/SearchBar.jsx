// --- Imports ---
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchBar.module.css';

// --- Component Definition ---
function SearchBar({ compact = false }) {
  // --- State ---
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(!compact);
  const navigate = useNavigate();

  // --- Handlers ---
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      if (compact) setIsExpanded(false);
    }
  };

  const toggleExpand = () => {
    if (compact) {
      setIsExpanded(!isExpanded);
      if (!isExpanded) {
        // Focus the input shortly after expanding animation (if any)
        setTimeout(() => {
          document.getElementById('search-input')?.focus();
        }, 100);
      }
    }
  };

  // --- JSX Structure ---
  return (
    <div className={`${styles.searchContainer} ${compact ? styles.compact : ''} ${isExpanded ? styles.expanded : ''}`}>
      {compact && (
        <button
          className={styles.searchIcon}
          onClick={toggleExpand}
          aria-label="Search the Bible"
        >
          🔍
        </button>
      )}

      {(!compact || isExpanded) && (
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <input
            id="search-input"
            type="text"
            placeholder="Search Bible verses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={!query.trim()}
          >
            Search
          </button>
        </form>
      )}
    </div>
  );
}

export default SearchBar;