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
    // Simulate checking stored token/session on initial load
    const timer = setTimeout(() => {
      // In a real app: verify token, fetch user, setIsAuthenticated(true), setUser(...)
      setIsLoading(false); // Finished initial check
    }, 500); // Simulate check time

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, []); // Run only once on mount

  // --- Auth Functions (Mock Implementation) ---
  // eslint-disable-next-line no-unused-vars
  const login = useCallback(async (email, _password) => {
    setIsLoading(true);
    // Simulate API Call (TODO: Replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUserData = { id: '123', name: 'Test User', email: email, denomination: 'Unknown' };
    setUser(mockUserData);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  }, []);

  const signup = useCallback(async (name, email, password, denomination) => {
    setIsLoading(true);
    // Simulate API Call (TODO: Replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockUserData = { id: '456', name: name, email: email, denomination: denomination };
    setUser(mockUserData);
    setIsAuthenticated(true);
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // Simulate API Call (TODO: Replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    setIsAuthenticated(false);
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