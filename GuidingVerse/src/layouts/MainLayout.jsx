import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed
import styles from './MainLayout.module.css'; // 1. Import the CSS Module

function MainLayout() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      console.log("Logout successful, navigated to login.");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // 2. Remove the inline 'styles' object - no longer needed

  return (
    <div>
      {/* 3. Apply class names using styles object */}
      <header className={styles.header}>
        <Link to="/" className={styles.titleLink}><h1>GuidingVerse</h1></Link>

        <nav className={styles.nav}>
          <Link to="/reader" className={styles.navLink}>Reader</Link>
          {isAuthenticated ? (
            <>
              {user && <span className={styles.userInfo}>Welcome, {user.name || user.email}!</span>}
              <Link to="/profile" className={styles.navLink}>Profile</Link>
              <button onClick={handleLogout} disabled={isLoading} className={styles.logoutButton}>
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/signup" className={styles.navLink}>Sign Up</Link>
            </>
          )}
           <Link to="/about" className={styles.navLink}>About</Link>
        </nav>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} GuidingVerse. </p>
        <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
        <Link to="/terms" className={styles.footerLink}>Terms</Link>
      </footer>
    </div>
  );
}

export default MainLayout;