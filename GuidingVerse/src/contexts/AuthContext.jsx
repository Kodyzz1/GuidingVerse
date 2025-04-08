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
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('Auth state loaded from localStorage');
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

      // Login successful
      const userData = {
          // Map data from backend response (ensure fields match)
          id: data._id, 
          name: data.username, 
          email: data.email,
          denomination: data.denomination
      }; 
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData)); // Persist user
      console.log('Login successful, user state updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Login API call failed:', error);
      // Clear any potentially outdated user state on login failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
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

      // Signup successful - Log the user in immediately
      const userData = {
          id: data._id, 
          name: data.username,
          email: data.email,
          denomination: data.denomination
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData)); // Persist user
      console.log('Signup successful, user logged in, state updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Signup API call failed:', error);
      // Ensure user state is cleared if signup fails after a potential previous login
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
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
    console.log('User logged out, state cleared.');
    setIsLoading(false);
    return true;
  }, []);

  // --- Memoized Context Value ---
  // Ensures context value object has stable identity unless dependencies change
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout
  }), [user, isAuthenticated, isLoading, login, signup, logout]);

  // --- Provider JSX ---
  // Render children only after initial loading check is complete
  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div>Loading Application...</div> // Optional: Replace with a loading component
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