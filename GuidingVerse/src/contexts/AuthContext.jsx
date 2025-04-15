// --- Imports ---
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback
} from 'react';
import PropTypes from 'prop-types';

// --- Context Creation ---
const AuthContext = createContext(null);

// --- Provider Component ---
export function AuthProvider({ children }) {
  // --- State ---
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial auth check

  // --- Effect for Initial Auth Check ---
  useEffect(() => {
    // Check localStorage for persisted user data on initial load
    try {
      const storedUser = localStorage.getItem('guidingVerseUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Include last read AND bookmark info
        setUser({
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          denomination: parsedUser.denomination,
          lastReadBook: parsedUser.lastReadBook || 'Genesis',
          lastReadChapter: parsedUser.lastReadChapter || 1,
          bookmarkedBook: parsedUser.bookmarkedBook || null, // Add bookmark
          bookmarkedChapter: parsedUser.bookmarkedChapter || null // Add bookmark
        });
        setIsAuthenticated(true);
        console.log('Auth state (incl. bookmark) loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('guidingVerseUser'); // Clear corrupted data
    } finally {
      setIsLoading(false); // Finished initial check
    }
  }, []); // Run only once on mount

  // --- Auth Functions (Real Implementation) ---
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', { // Assumes proxy or same origin
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Include last read AND bookmark info
      const userData = {
          id: data._id,
          name: data.username,
          email: data.email,
          denomination: data.denomination,
          lastReadBook: data.lastReadBook || 'Genesis',
          lastReadChapter: data.lastReadChapter || 1,
          bookmarkedBook: data.bookmarkedBook || null,
          bookmarkedChapter: data.bookmarkedChapter || null
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData));
      // --- STORE THE TOKEN --- 
      if (data.token) {
          localStorage.setItem('guidingVerseToken', data.token);
          console.log('Auth token stored in localStorage.');
      } else {
          console.warn('No token received from login endpoint.');
      }
      // -----------------------
      console.log('Login successful, user state (incl. bookmark) updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Login API call failed:', error);
      // Clear any potentially outdated user state on login failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
      localStorage.removeItem('guidingVerseToken'); // Clear token on failed login
      throw error; // Re-throw the error so LoginPage can catch it and display message
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Signup Function --- //
  const signup = useCallback(async (username, email, password, denomination) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', { // Assumes proxy or same origin
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, denomination }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(data.message || `Signup failed with status ${response.status}`);
      }

       // Include last read AND bookmark info (defaults to null for new users)
      const userData = {
          id: data._id,
          name: data.username,
          email: data.email,
          denomination: data.denomination,
          lastReadBook: data.lastReadBook || 'Genesis',
          lastReadChapter: data.lastReadChapter || 1,
          bookmarkedBook: data.bookmarkedBook || null,
          bookmarkedChapter: data.bookmarkedChapter || null
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData));
      // --- STORE THE TOKEN --- 
      if (data.token) {
          localStorage.setItem('guidingVerseToken', data.token);
          console.log('Auth token stored in localStorage after signup.');
      } else {
          console.warn('No token received from register endpoint.');
      }
      // -----------------------
      console.log('Signup successful, user logged in, state (incl. bookmark) updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Signup API call failed:', error);
      // Ensure user state is cleared if signup fails after a potential previous login
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
      localStorage.removeItem('guidingVerseToken'); // Clear token on failed signup
      throw error; // Re-throw the error so SignupPage can catch it and display message
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // TODO: Add API call to backend logout endpoint if needed (e.g., to invalidate tokens)
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('guidingVerseUser'); // Clear persisted data
    localStorage.removeItem('guidingVerseToken'); // <-- Clear token on logout
    console.log('User logged out, state and token cleared.');
    setIsLoading(false);
    return true;
  }, []);

  // --- Bookmark Function --- //
  const setBookmark = useCallback(async (book, chapter) => {
    // console.log('[AuthContext] setBookmark START', { book, chapter }); // <-- REMOVE
    if (!isAuthenticated || !user) {
      // console.warn('[AuthContext] setBookmark EXIT - User not authenticated.', {isAuthenticated, hasUser: !!user}); // <-- REMOVE
      return false;
    }
    // console.log('[AuthContext] setBookmark User authenticated. Checking token...'); // <-- REMOVE
    setIsLoading(true); // <-- UNCOMMENT
    try {
      const token = localStorage.getItem('guidingVerseToken');
      // console.log('[AuthContext] setBookmark token from localStorage:', token ? '*** (exists)' : 'null or undefined'); // <-- REMOVE
      if (!token) {
          // console.error('[AuthContext] setBookmark EXIT - Token not found in localStorage.'); // <-- REMOVE
        throw new Error('Authentication token not found.');
      }

      // console.log('[AuthContext] setBookmark Making FETCH call...'); // <-- REMOVE
      const response = await fetch('/api/auth/bookmark', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book, chapter }),
      });
      // console.log('[AuthContext] setBookmark FETCH response status:', response.status); // <-- REMOVE

      const data = await response.json();

      if (!response.ok) {
          // console.error('[AuthContext] setBookmark FETCH failed:', data.message); // <-- REMOVE
        throw new Error(data.message || 'Failed to update bookmark on server');
      }

      // Update local state and localStorage
      const updatedUserData = { ...user, bookmarkedBook: book, bookmarkedChapter: chapter };
      // console.log('[AuthContext] Before setUser:', user); // Optional: Log state before update
      setUser(updatedUserData);
      localStorage.setItem('guidingVerseUser', JSON.stringify(updatedUserData));
      console.log('[AuthContext] SUCCESS: Local state & localStorage updated with:', updatedUserData.bookmarkedBook, updatedUserData.bookmarkedChapter); // <-- ADD THIS LOG
      // console.log('[AuthContext] SUCCESS: Local state & localStorage updated with:', { bookmarkedBook: updatedUserData.bookmarkedBook, bookmarkedChapter: updatedUserData.bookmarkedChapter }); // Alternative format
      // console.log('[AuthContext] setBookmark SUCCESS (local & server):', book, chapter); // <-- REMOVE
      return true;

    } catch (error) {
      // console.error('[AuthContext] setBookmark CATCH block error:', error); // <-- REMOVE
      // Keep console.error for actual operational errors if desired, or remove this too
      console.error('Failed to save bookmark:', error.message); // Keep a user-facing error log maybe?
      return false;
    } finally {
      setIsLoading(false); // <-- UNCOMMENT
      // console.log('[AuthContext] setBookmark FINALLY block.'); // <-- REMOVE
    }
  }, [user, isAuthenticated]); // Add dependencies

  // --- Function to update parts of user state locally ---
  // Useful for non-critical updates like last read without full re-fetch
  const updateUserState = useCallback((updatedFields) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newUserState = { ...currentUser, ...updatedFields };
      // Also update localStorage so reloads reflect the change
      localStorage.setItem('guidingVerseUser', JSON.stringify(newUserState));
      console.log('[AuthContext] updateUserState updated state and localStorage:', updatedFields);
      return newUserState;
    });
  }, []); // No dependencies needed as it only uses the setter

  // --- Memoized Context Value ---
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    setBookmark,
    updateUserState // <-- Add updateUserState to context value
  }), [user, isAuthenticated, isLoading, login, signup, logout, setBookmark, updateUserState]); // Add updateUserState dependency

  // --- Provider JSX ---
  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        null
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// --- Provider Prop Types ---
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// --- Custom Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    // Ensures hook is used within a provider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};