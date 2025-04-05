import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react'; // Make sure useCallback is imported
import PropTypes from 'prop-types'
// 1. Create the Context
const AuthContext = createContext(null);

// 2. Create the Provider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ... (useEffect for initial load check remains the same) ...

  // 3. Define Auth Functions wrapped in useCallback

  const login = useCallback(async (email, password) => {
    console.log("Attempting login with:", email);
    setIsLoading(true);
    // Simulate API Call (Replace Later)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUserData = { id: '123', name: 'Test User', email: email, denomination: 'Unknown' };
    setUser(mockUserData);
    setIsAuthenticated(true);
    setIsLoading(false);
    console.log("Login successful (mock)");
    return true;
  }, []); // Empty dependency array: function doesn't depend on props/state from AuthProvider scope

  const signup = useCallback(async (name, email, password, denomination) => {
    console.log("Attempting signup for:", email);
    setIsLoading(true);
    // Simulate API Call (Replace Later)
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockUserData = { id: '456', name: name, email: email, denomination: denomination };
    setUser(mockUserData);
    setIsAuthenticated(true);
    setIsLoading(false);
    console.log("Signup successful (mock)");
    return true;
  }, []); // Empty dependency array

  const logout = useCallback(async () => {
    console.log("Logging out");
    setIsLoading(true);
    // Simulate API Call (Replace Later)
    await new Promise(resolve => setTimeout(resolve, 300));
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    console.log("Logout successful (mock)");
    return true;
  }, []); // Empty dependency array

  // 4. Define the Context Value using useMemo with stable function references
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,    // Now passing the stable memoized function reference
    signup,   // Now passing the stable memoized function reference
    logout    // Now passing the stable memoized function reference
  }), [user, isAuthenticated, isLoading, login, signup, logout]); // Dependencies now include stable functions and changing state


  // 5. Return the Provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired
};

// 6. Create and Export Custom Hook (remains the same)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Corrected check: should be undefined, not null, based on createContext(null) potentially
    throw new Error('useAuth must be used within an AuthProvider');
  }
   if (context === null) { // Add explicit null check if initial value is null and context hasn't initialized (though unlikely with provider structure)
     throw new Error('AuthContext is null, ensure AuthProvider has rendered');
   }
  return context;
};