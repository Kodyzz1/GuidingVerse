import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Adjust path if needed
import styles from './Navbar.module.css'; // Assuming you have styles

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to home after logout
  };

  // --- NEW: Go to Bookmark Handler ---
  const handleGoToBookmark = () => {
    if (user && user.bookmarkedBook && user.bookmarkedChapter) {
      console.log(`Navigating to bookmark: ${user.bookmarkedBook} ${user.bookmarkedChapter}`);
      navigate(`/read?book=${encodeURIComponent(user.bookmarkedBook)}&chapter=${user.bookmarkedChapter}`);
    } else {
      console.log('No bookmark set to navigate to.');
      // Optionally alert the user or disable the button if no bookmark is set
      alert('No bookmark set.');
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navBrand}>
        <Link to="/">GuidingVerse</Link>
      </div>
      <ul className={styles.navLinks}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/read">Bible Reader</Link></li>
        {/* Add other links as needed */} 
      </ul>
      <div className={styles.navAuth}>
        {isAuthenticated && user ? (
          <>
            {/* --- NEW: Go to Bookmark Button --- */}
            {user.bookmarkedBook && (
              <button 
                onClick={handleGoToBookmark} 
                className={`${styles.navButton} ${styles.bookmarkNavButton}`} 
                title={`Go to bookmark: ${user.bookmarkedBook} ${user.bookmarkedChapter}`}
              >
                <span className={styles.iconGoToBookmark}>&#x1F517;</span> {/* Link icon or similar */} Go to Bookmark
              </button>
            )}
            <span className={styles.welcomeMessage}>Welcome, {user.name}!</span>
            <button onClick={handleLogout} className={styles.navButton}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.navLinkButton}>Login</Link>
            <Link to="/signup" className={styles.navLinkButton}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 