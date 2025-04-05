import React from 'react';
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path if needed
// Optional: Import a CSS module for styling later
// import styles from './ProfilePage.module.css';

function ProfilePage() {
  // Get the current user data from the AuthContext
  const { user } = useAuth();

  // The ProtectedRoute should already prevent access if not authenticated,
  // and handle the initial loading state. But as a safeguard,
  // we can check if user data exists before trying to display it.
  if (!user) {
    // This case should theoretically not be reached if ProtectedRoute works correctly
    // and AuthContext sets user upon authentication.
    return <div>Loading user data or not logged in...</div>;
  }

  // If user data exists, display it
  return (
    // Optional: Add a wrapper div with className={styles.container} if using CSS Modules
    <div>
      <h2>User Profile</h2>
      <div>
        <p>
          <strong>Name:</strong> {user.name || 'N/A'}
        </p>
        <p>
          <strong>Email:</strong> {user.email || 'N/A'}
        </p>
        <p>
          <strong>Selected Denomination:</strong> {user.denomination || 'N/A'}
        </p>
      </div>
      {/* Add more sections later, e.g., for changing password or denomination */}
    </div>
  );
}

export default ProfilePage;