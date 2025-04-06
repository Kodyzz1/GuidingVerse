// src/features/search/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import DOMPurify from 'dompurify';
import styles from './SearchResultsPage.module.css';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;
  
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return;
      
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`/api/bible/search?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${resultsPerPage}`);
        
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        
        const data = await response.json();
        setResults(data.results || []);
        setTotalResults(data.total || 0);
      } catch (err) {
        console.error('Error during search:', err);
        setError('Failed to perform search. Please try again.');
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query, currentPage]);
  
  // For demonstration purposes, we'll create mock results if API isn't ready
  useEffect(() => {
    if (!query) return;
    
    // This is just for demonstration until the real API is implemented
    // Remove this once the actual search API is in place
    if (results.length === 0 && !loading && !error) {
      const mockResults = generateMockResults(query, 35);
      setResults(mockResults.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage));
      setTotalResults(mockResults.length);
    }
  }, [query, loading, error, results.length, currentPage]);
  
  // Helper function to generate mock results
  const generateMockResults = (searchQuery, count) => {
    const mockResults = [];
    const books = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Psalms', 'Proverbs', 'Isaiah', 'Matthew', 'John', 'Romans', 'Revelation'];
    
    for (let i = 0; i < count; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const chapter = Math.floor(Math.random() * 20) + 1;
      const verse = Math.floor(Math.random() * 30) + 1;
      
      // Create some mock text that contains the search query
      const beforeText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. `;
      const afterText = ` Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
      
      mockResults.push({
        book,
        chapter,
        verse,
        text: `${beforeText}<strong>${searchQuery}</strong>${afterText}`,
        reference: `${book} ${chapter}:${verse}`
      });
    }
    
    return mockResults;
  };
  
  // Calculate total pages for pagination
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  
  return (
    <div className={styles.searchResultsContainer}>
      <h1 className={styles.pageTitle}>Bible Search</h1>
      
      <div className={styles.searchBarContainer}>
        <SearchBar />
      </div>
      
      {query && (
        <div className={styles.resultsHeader}>
          <h2 className={styles.resultsTitle}>
            {loading ? 'Searching...' : `Results for "${query}"`}
          </h2>
          {!loading && (
            <p className={styles.resultsSummary}>
              Found {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Searching the Bible...</p>
        </div>
      ) : (
        <>
          {results.length > 0 ? (
            <div className={styles.resultsContainer}>
              <ul className={styles.resultsList}>
                {results.map((result, index) => (
                  <li key={index} className={styles.resultItem}>
                    <Link 
                      to={`/reader?book=${encodeURIComponent(result.book)}&chapter=${result.chapter}`}
                      className={styles.resultLink}
                    >
                      <span className={styles.resultReference}>{result.reference}</span>
                    </Link>
                    <div 
                      className={styles.resultText}
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(result.text, {
                          ALLOWED_TAGS: ['strong'],
                          ALLOWED_ATTR: []
                        })
                      }}
                    />
                  </li>
                ))}
              </ul>
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationButton}
                  >
                    Previous
                  </button>
                  
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationButton}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            query && !loading && (
              <div className={styles.noResults}>
                <p>No results found for "{query}".</p>
                <p>Try different keywords or check your spelling.</p>
              </div>
            )
          )}
        </>
      )}
      
      {!query && (
        <div className={styles.searchInstructions}>
          <h2>Search the Bible</h2>
          <p>Enter a word, phrase, or reference to search the Bible.</p>
          <ul className={styles.searchTips}>
            <li>Use quotation marks for exact phrases: "love one another"</li>
            <li>Search for references: John 3:16, Genesis 1</li>
            <li>Use simple words for best results</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;