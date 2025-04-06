// --- Imports ---
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import DOMPurify from 'dompurify';
import styles from './SearchResultsPage.module.css';

// --- Component Definition ---
function SearchResultsPage() {
  // --- State ---
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20; // Configurable: Could be moved to constants or settings

  // --- Effects ---
  // Fetch search results when query or page changes
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setTotalResults(0);
        setError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // Construct API URL with query, current page, and limit
        const apiUrl = `/api/bible/search?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${resultsPerPage}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }

        const data = await response.json();
        setResults(data.results || []);
        setTotalResults(data.total || 0);
      } catch (err) {
        setError('Failed to perform search. Please try again.');
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, currentPage]); // Re-run effect if query or currentPage changes

  // --- Derived State ---
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  // --- JSX Structure ---
  return (
    <div className={styles.searchResultsContainer}>
      <h1 className={styles.pageTitle}>Bible Search</h1>

      <div className={styles.searchBarContainer}>
        <SearchBar />
      </div>

      {/* Results Header */}
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

      {/* Error Message */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Searching the Bible...</p>
        </div>
      ) :
      /* Results List & Pagination */
      (
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
                    {/* Sanitize result text allowing only <strong> */}
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

              {/* Pagination Controls */}
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
          ) :
          /* No Results Message */
          (
            query && !loading && (
              <div className={styles.noResults}>
                <p>No results found for "{query}".</p>
                <p>Try different keywords or check your spelling.</p>
              </div>
            )
          )}
        </>
      )}

      {/* Initial Search Instructions */}
      {!query && !loading && (
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