import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if needed

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation(); // Get current location user is trying to access

  // 1. Handle the initial loading state from AuthContext
  if (isLoading) {
    // Show a loading indicator while checking auth status
    // You might want a more sophisticated spinner component here later
    return <div>Checking authentication...</div>;
  }

  // 2. If not loading and not authenticated, redirect to login
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to in the state. This allows us to send them back after login.
    // 'replace' prevents the login page from being added to the history stack.
    console.log('ProtectedRoute: Not authenticated, redirecting to login from:', location.pathname); // For debugging
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If not loading and authenticated, render the child component
  // This allows the user to access the protected page
  return children;
}

// Prop validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;