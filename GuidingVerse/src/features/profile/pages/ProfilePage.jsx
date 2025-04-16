// --- Imports ---
import { useState, useEffect } from 'react'; // Import useState, useEffect
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ProfilePage.module.css'; // Import the CSS module

// --- Component Definition ---
function ProfilePage() {
  // --- Auth Hook ---
  const { user, updateUserState } = useAuth();

  // --- State for Edit Mode and Form Data ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    denomination: ''
  });
  const [isLoading, setIsLoading] = useState(false); // For save loading state
  const [error, setError] = useState(null); // For API errors

  // --- Denominations List (Can be moved to constants file) ---
  const denominations = [
    "Non-Denominational",
    "Baptist",
    "Catholic",
    "Methodist",
    "Lutheran",
    "Presbyterian",
    "Pentecostal",
    "Anglican",
    "Orthodox",
    "Other",
    "Prefer not to say"
  ];

  // --- Effect to initialize form data when user loads/changes ---
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || '',
        denomination: user.denomination || 'Prefer not to say' 
      });
    }
  }, [user]); // Re-run if user object changes

  // --- Handlers ---
  const handleEditClick = () => {
    setIsEditing(true);
    setError(null); // Clear previous errors
    // Reset form data to current user state in case of previous cancelled edits
    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || '',
        denomination: user.denomination || 'Prefer not to say'
      });
    }
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError(null);
    // Optionally reset form data, though handleEditClick already does
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault(); // Prevent default form submission
    setIsLoading(true);
    setError(null);

    // Basic frontend validation (optional, enhance as needed)
    if (!formData.username || !formData.email) {
        setError('Username and Email cannot be empty.');
        setIsLoading(false);
        return;
    }
    
    // Filter out fields that haven't changed from the original user object
    const changedData = {};
    if (formData.username !== user.name) changedData.username = formData.username;
    if (formData.email !== user.email) changedData.email = formData.email;
    if (formData.denomination !== user.denomination) changedData.denomination = formData.denomination;

    if (Object.keys(changedData).length === 0) {
        setError('No changes detected.');
        setIsEditing(false); // Exit edit mode if no changes
        setIsLoading(false);
        return;
    }

    try {
        const token = localStorage.getItem('guidingVerseToken');
        if (!token) {
            throw new Error('Authentication token not found.');
        }

        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(changedData) // Send only changed data
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile.');
        }

        // Update AuthContext state with the full updated user data from response
        if (updateUserState) {
            updateUserState({
                name: data.username, // Use updated field names from response
                email: data.email,
                denomination: data.denomination,
                // Keep other fields like lastRead, bookmark, etc. from existing user state
                // as the PUT /profile response doesn't return them all currently.
                // A better approach might be a dedicated fetchProfile() after update, 
                // or ensuring PUT /profile returns the *full* necessary user object.
            });
        }

        setIsEditing(false); // Exit edit mode on success
        alert('Profile updated successfully!'); // Simple confirmation

    } catch (err) {
        console.error("Profile update error:", err);
        setError(err.message || 'An error occurred while updating profile.');
    } finally {
        setIsLoading(false);
    }
  };

  // --- Conditional Render (Loading/Not Logged In) ---
  if (!user) {
    return <div className={styles.profileContainer}><p>Loading user data or not logged in...</p></div>;
  }

  // --- JSX Structure --- 
  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <h2>User Profile</h2>
      </header>

      {/* --- Account Information Section --- */}
      <section className={styles.profileSection}>
        <h3>Account Information</h3>
        {error && <p className={styles.errorMessage}>{error}</p>} 
        {isEditing ? (
          // --- EDIT FORM --- 
          <form onSubmit={handleSave}>
            <div className={styles.formGrid}> 
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />

              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />

              <label htmlFor="denomination">Denomination:</label>
              <select
                id="denomination"
                name="denomination"
                value={formData.denomination}
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                {denominations.map(denom => (
                  <option key={denom} value={denom}>{denom}</option>
                ))}
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.saveButton} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className={styles.cancelButton} onClick={handleCancelClick} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          // --- DISPLAY VIEW --- 
          <>
            <dl className={styles.infoGrid}>
              <dt>Username:</dt>
              <dd>{user.name || 'N/A'}</dd>

              <dt>Email:</dt>
              <dd>{user.email || 'N/A'}</dd>

              <dt>Denomination:</dt>
              <dd>{user.denomination || 'N/A'}</dd>
            </dl>
            <div className={styles.buttonContainer}>
              <button className={styles.editButton} onClick={handleEditClick}>
                Edit Profile
              </button>
            </div>
          </>
        )}
      </section>

      {/* --- Reading Information Section (No edit needed here for now) --- */}
      <section className={styles.profileSection}>
          <h3>Reading Progress</h3>
          <dl className={styles.infoGrid}>
              <dt>Last Read:</dt>
              <dd>{user.lastReadBook || '-'} {user.lastReadChapter || '-'}</dd>
              
              <dt>Bookmark:</dt>
              <dd>{user.bookmarkedBook ? `${user.bookmarkedBook} ${user.bookmarkedChapter}` : 'Not Set'}</dd>
          </dl>
      </section>

      {/* --- Security Section (Placeholder) --- */}
      <section className={styles.profileSection}>
          <h3>Security</h3>
          <div className={styles.placeholder}>(Change password feature coming soon)</div>
      </section>
      
    </div>
  );
}

export default ProfilePage;