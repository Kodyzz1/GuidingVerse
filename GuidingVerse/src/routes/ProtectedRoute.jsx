import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

// --- Component Definition (ProtectedRoute) ---
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Optional: Replace with a proper loading spinner component
    return <div>Checking authentication...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login, saving the intended destination (location.pathname)
    // so the user can be redirected back after successful login.
    // 'replace' prevents the login page from adding to the history stack.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the requested component
  return children;
}

// --- Prop Types ---
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;