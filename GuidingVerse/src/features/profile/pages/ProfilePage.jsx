// --- Imports ---
import { useAuth } from '../../../contexts/AuthContext';
// TODO: Create and import ProfilePage.module.css if needed
// import styles from './ProfilePage.module.css';

// --- Component Definition ---
function ProfilePage() {
  // --- Auth Hook ---
  const { user } = useAuth();

  // --- Conditional Render (Loading/Not Logged In) ---
  // Safeguard: ProtectedRoute should handle this, but check user exists.
  if (!user) {
    return <div>Loading user data or not logged in...</div>;
  }

  // --- JSX Structure ---
  // Optional: Use styles.container if using CSS Modules
  return (
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
      {/* TODO: Add sections for editing profile, changing password, etc. */}
    </div>
  );
}

export default ProfilePage;