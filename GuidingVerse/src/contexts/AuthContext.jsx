// src/contexts/AuthContext.jsx

import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    useCallback
  } from 'react';
  import PropTypes from 'prop-types';
  
  // 1. Create the Context
  const AuthContext = createContext(null);
  
  // 2. Create the Provider Component
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Initialize isLoading to true to simulate the initial check
    const [isLoading, setIsLoading] = useState(true);
  
    // Effect to simulate checking initial authentication status
    useEffect(() => {
      console.log("AuthContext: Initial useEffect RUNNING."); // Debug log
      // This setTimeout simulates checking a token or session
      const timer = setTimeout(() => {
        console.log("AuthContext: setTimeout CALLBACK executing. Setting isLoading to false."); // Debug log
        // In a real app, you'd verify token here and potentially set user/isAuthenticated
        setIsLoading(false); // Mark initial loading as complete
      }, 500); // Simulate 500ms check time
  
      // Cleanup function to clear the timeout if the component unmounts
      return () => {
        console.log("AuthContext: useEffect CLEANUP running."); // Debug log
        clearTimeout(timer);
      };
    }, []); // Empty dependency array means this runs only once on mount
  
    // 3. Define Auth Functions wrapped in useCallback
    const login = useCallback(async (email, password) => {
      console.log("AuthContext: login function called with:", email); // Debug log
      setIsLoading(true);
      // Simulate API Call (Replace Later)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUserData = { id: '123', name: 'Test User', email: email, denomination: 'Unknown' };
      setUser(mockUserData);
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log("AuthContext: login successful (mock)"); // Debug log
      return true;
    }, []); // Empty dependency array
  
    const signup = useCallback(async (name, email, password, denomination) => {
      console.log("AuthContext: signup function called for:", email); // Debug log
      setIsLoading(true);
      // Simulate API Call (Replace Later)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUserData = { id: '456', name: name, email: email, denomination: denomination };
      setUser(mockUserData);
      setIsAuthenticated(true);
      setIsLoading(false);
      console.log("AuthContext: signup successful (mock)"); // Debug log
      return true;
    }, []); // Empty dependency array
  
    const logout = useCallback(async () => {
      console.log("AuthContext: logout function called"); // Debug log
      setIsLoading(true);
      // Simulate API Call (Replace Later)
      await new Promise(resolve => setTimeout(resolve, 300));
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      console.log("AuthContext: logout successful (mock)"); // Debug log
      return true;
    }, []); // Empty dependency array
  
    // 4. Define the Context Value using useMemo with stable function references
    const value = useMemo(() => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout
    }), [user, isAuthenticated, isLoading, login, signup, logout]); // Dependencies
  
    // 5. Return the Provider - Conditionally render children based on initial loading
    return (
      <AuthContext.Provider value={value}>
        {isLoading ? (
          <div>Loading Application...</div> /* Or a proper loading spinner component */
        ) : (
          children
        )}
      </AuthContext.Provider>
    );
  }
  
  // 3. Define propTypes for AuthProvider
  AuthProvider.propTypes = {
    children: PropTypes.node.isRequired // Validate children prop
  };
  
  // 6. Create and Export Custom Hook for easy consumption
  export const useAuth = () => {
    const context = useContext(AuthContext);
    // Check if context exists before using it - important!
    if (context === undefined) {
       // This error usually means useAuth was called outside of AuthProvider
      throw new Error('useAuth must be used within an AuthProvider');
    }
     if (context === null && !context) { // Added !context for robustness if initial value was undefined
      // This might happen if AuthProvider hasn't rendered or there's an issue higher up
       throw new Error('AuthContext is null or undefined, ensure AuthProvider has rendered properly');
     }
    return context;
  };