// --- Imports ---
import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './MainLayout.module.css';

// --- Component Definition ---
function MainLayout() {
  // --- State ---
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileButtonRef = useRef(null);

  // --- Handlers & Helpers ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // --- Effect for Click Outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(event.target)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // --- JSX Structure ---
  return (
    <div className={styles.layout}>
      {/* --- Header --- */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logoContainer}>
            <div className={styles.logo}>GV</div>
            <h1 className={styles.title}>GuidingVerse</h1>
          </Link>

          {/* Mobile menu button */}
          <button
            ref={mobileButtonRef}
            className={`${styles.mobileMenuButton} ${mobileMenuOpen ? styles.mobileButtonOpen : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>

          {/* Navigation links - desktop */}
          <nav className={styles.desktopNav}>
            <Link
              to="/reader"
              className={`${styles.navLink} ${isActive('/reader') ? styles.activeLink : ''}`}
            >
              Reader
            </Link>
            <Link
              to="/about"
              className={`${styles.navLink} ${isActive('/about') ? styles.activeLink : ''}`}
            >
              About
            </Link>
            <Link
              to="/how-it-works"
              className={`${styles.navLink} ${isActive('/how-it-works') ? styles.activeLink : ''}`}
            >
              How It Works
            </Link>
          </nav>

          {/* Search Bar (Commented Out) */}
          {/* <div className={styles.searchBarWrapper}>
            <SearchBar compact={true} />
          </div> */}

          {/* Auth section - desktop */}
          <div className={styles.authSection}>
            {isAuthenticated ? (
              <div className={styles.userSection}>
                {user && (
                  <Link to="/profile" className={styles.profileLink}>
                    <div className={styles.userAvatar}>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className={styles.userName}>{user.name || user.email}</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoading}
                  className={styles.logoutButton}
                >
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login" className={styles.loginButton}>Login</Link>
                <Link to="/signup" className={styles.signupButton}>Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile navigation menu */}
        <div
          ref={mobileMenuRef}
          className={`${styles.mobileNav} ${mobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          <nav className={styles.mobileNavLinks}>
            <Link
              to="/reader"
              className={`${styles.mobileNavLink} ${isActive('/reader') ? styles.activeLink : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Reader
            </Link>
            <Link
              to="/about"
              className={`${styles.mobileNavLink} ${isActive('/about') ? styles.activeLink : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/how-it-works"
              className={`${styles.mobileNavLink} ${isActive('/how-it-works') ? styles.activeLink : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>

            {/* Search Link (Commented Out) */}
            {/* <Link
              to="/search"
              className={`${styles.mobileNavLink} ${isActive('/search') ? styles.activeLink : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Search
            </Link> */}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={`${styles.mobileNavLink} ${isActive('/profile') ? styles.activeLink : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={styles.mobileLogoutButton}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={styles.mobileNavLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`${styles.mobileNavLink} ${styles.mobileSignupLink}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* --- Footer --- */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>GV</div>
            <h2 className={styles.footerTitle}>GuidingVerse</h2>
            <p className={styles.footerTagline}>Your companion for Scripture study</p>
          </div>

          <div className={styles.footerLinks}>
            <div className={styles.footerLinkGroup}>
              <h3 className={styles.footerLinkTitle}>Navigation</h3>
              <ul>
                <li><Link to="/" className={styles.footerLink}>Home</Link></li>
                <li><Link to="/reader" className={styles.footerLink}>Bible Reader</Link></li>
                <li><Link to="/about" className={styles.footerLink}>About</Link></li>
                <li><Link to="/how-it-works" className={styles.footerLink}>How It Works</Link></li>
              </ul>
            </div>

            <div className={styles.footerLinkGroup}>
              <h3 className={styles.footerLinkTitle}>Account</h3>
              <ul>
                {isAuthenticated ? (
                  <>
                    <li><Link to="/profile" className={styles.footerLink}>Profile</Link></li>
                    <li><button onClick={handleLogout} className={styles.footerLinkButton}>Logout</button></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className={styles.footerLink}>Login</Link></li>
                    <li><Link to="/signup" className={styles.footerLink}>Sign Up</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div className={styles.footerLinkGroup}>
              <h3 className={styles.footerLinkTitle}>Legal</h3>
              <ul>
                <li><Link to="/terms" className={styles.footerLink}>Terms of Service</Link></li>
                <li><Link to="/privacy" className={styles.footerLink}>Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} GuidingVerse. All rights reserved.</p>
          <p className={styles.attribution}>
            <a target="_blank" href="https://icons8.com/icon/m2PjufwRQ03T/holy-bible" rel="noopener noreferrer">Bible</a> icon by <a target="_blank" href="https://icons8.com" rel="noopener noreferrer">Icons8</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;