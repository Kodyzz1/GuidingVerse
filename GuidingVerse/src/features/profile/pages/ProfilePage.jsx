// --- Imports ---
import { useState, useEffect, useCallback } from 'react'; // Import useState, useEffect, useCallback
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ProfilePage.module.css'; // Import the CSS module

// Helper function to convert Base64 URL string to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- Component Definition ---
function ProfilePage() {
  // --- Auth Hook ---
  const { user, updateUserState, isAuthenticated } = useAuth();

  // --- State for Edit Mode and Form Data ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    denomination: '',
    preferredNotificationHour: null // Add state for notification hour
  });
  const [isLoading, setIsLoading] = useState(false); // For save loading state
  const [error, setError] = useState(null); // For API errors
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

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
        denomination: user.denomination || 'Prefer not to say',
        // Initialize from user context, use null if undefined/not set
        preferredNotificationHour: user.preferredNotificationHour !== undefined ? user.preferredNotificationHour : null 
      });
    }
  }, [user]); // Re-run if user object changes

  // Check initial notification permission and subscription status
  useEffect(() => {
      if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && user) {
          // Check permission status
          if (Notification.permission === 'granted') {
              // Check if already subscribed
              navigator.serviceWorker.ready.then(registration => {
                  registration.pushManager.getSubscription().then(subscription => {
                      if (subscription) {
                          console.log('[ProfilePage] User IS subscribed.');
                          setNotificationsEnabled(true);
                          // Optional: Verify this subscription exists on the backend for this user
                      } else {
                          console.log('[ProfilePage] User IS NOT subscribed (permission granted).');
                          setNotificationsEnabled(false);
                      }
                      setIsCheckingNotifications(false);
                  });
              });
          } else {
              console.log('[ProfilePage] Notification permission:', Notification.permission);
              setNotificationsEnabled(false);
              setIsCheckingNotifications(false);
          }
      } else {
          console.warn('[ProfilePage] Push Notifications not supported by this browser or user not logged in.');
          setNotificationError('Push notifications are not supported by your browser.');
          setIsCheckingNotifications(false);
      }
  }, [user]); // Rerun when user loads

  // --- Handlers ---
  const handleEditClick = () => {
    setIsEditing(true);
    setError(null); // Clear previous errors
    // Reset form data to current user state in case of previous cancelled edits
    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || '',
        denomination: user.denomination || 'Prefer not to say',
        // Also reset notification hour on edit start
        preferredNotificationHour: user.preferredNotificationHour !== undefined ? user.preferredNotificationHour : null 
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
    // Add preferredNotificationHour to changed data if it differs
    if (formData.preferredNotificationHour !== (user.preferredNotificationHour !== undefined ? user.preferredNotificationHour : null)) {
        // Convert string from select back to number, or keep null
        changedData.preferredNotificationHour = formData.preferredNotificationHour === '' ? null : parseInt(formData.preferredNotificationHour, 10);
    }

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
                preferredNotificationHour: data.preferredNotificationHour, // Update context
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

  // --- Notification Subscription Handler ---
  const handleSubscribeClick = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !isAuthenticated) {
      setNotificationError('Push notifications not supported or user not logged in.');
      return;
    }

    setIsSubscribing(true);
    setNotificationError(null);

    try {
      // --- 1. Request Permission --- 
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied.');
      }

      // --- 2. Get Service Worker Registration --- 
      const registration = await navigator.serviceWorker.ready;
      console.log('[Subscribe] Service Worker Ready');

      // --- 3. Get VAPID Public Key from Backend --- 
      const keyResponse = await fetch('/api/notifications/vapid-public-key');
      if (!keyResponse.ok) {
          const keyErrorData = await keyResponse.json();
          throw new Error(keyErrorData.message || 'Failed to fetch VAPID key.');
      }
      const { publicKey } = await keyResponse.json();
      if (!publicKey) {
          throw new Error('VAPID key received from server was empty.');
      }
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      console.log('[Subscribe] VAPID Public Key fetched and converted');

      // --- 4. Subscribe using PushManager --- 
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
      console.log('[Subscribe] PushManager subscribed:', subscription);

      // --- 5. Send Subscription to Backend --- 
      const token = localStorage.getItem('guidingVerseToken');
      if (!token) throw new Error('Authentication token not found.');

      const saveResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription) // Send the whole subscription object
      });

      if (!saveResponse.ok) {
          const saveData = await saveResponse.json();
        throw new Error(saveData.message || 'Failed to save subscription on server.');
      }

      console.log('[Subscribe] Subscription saved on backend successfully.');
      setNotificationsEnabled(true);
      alert('Notifications enabled!');

    } catch (err) {
      console.error('[Subscribe] Error enabling notifications:', err);
      setNotificationError(err.message || 'Could not enable notifications.');
      setNotificationsEnabled(false);
      // Handle specific errors (e.g., permission denied)
      if (err.message.includes('permission denied')) {
          alert('You denied notification permission. You may need to enable it in browser settings.');
      } else {
          alert(`Error: ${err.message}`);
      }
    } finally {
      setIsSubscribing(false);
    }
  }, [isAuthenticated]); // Depend on auth status

  // --- Test Notification Handler ---
  const handleTestSendClick = useCallback(async () => {
    setIsSendingTest(true);
    setNotificationError(null); // Clear previous errors
    try {
        const token = localStorage.getItem('guidingVerseToken');
        if (!token) throw new Error('Authentication token not found.');

        const response = await fetch('/api/notifications/test-send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // No Content-Type needed for this simple POST
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to trigger test notification.');
        }

        alert(`Test notification triggered for: ${data.sentVerse}`);
        console.log('Test notification sent successfully via backend.');

    } catch (err) {
        console.error('[TestSend] Error triggering test notification:', err);
        setNotificationError(err.message || 'Could not trigger test notification.');
        alert(`Error: ${err.message}`);
    } finally {
        setIsSendingTest(false);
    }
  }, []); // No dependencies needed if it just makes an API call

  // --- Initialize Service Worker (if not handled elsewhere) --- 
  // This might be better placed in App.jsx or main.jsx to run once on load
  useEffect(() => {
      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js') // Path from public root
              .then(registration => {
                  console.log('[App] Service Worker registered with scope:', registration.scope);
              })
              .catch(error => {
                  console.error('[App] Service Worker registration failed:', error);
              });
      }
  }, []);

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

              {/* --- Add Preferred Notification Hour Dropdown --- */}
              <label htmlFor="preferredNotificationHour">VOTD Notification Time (UTC):</label>
              <select
                id="preferredNotificationHour"
                name="preferredNotificationHour"
                value={formData.preferredNotificationHour === null ? '' : formData.preferredNotificationHour} // Handle null value for "Off"
                onChange={handleInputChange}
                className={styles.formSelect}
              >
                <option value="">Off</option> { /* Represents null */}
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00 UTC
                  </option>
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

              {/* Display Preferred Notification Hour */}
              <dt>VOTD Notification Time:</dt>
              <dd>
                {user.preferredNotificationHour === null || user.preferredNotificationHour === undefined
                  ? 'Off'
                  : `${user.preferredNotificationHour.toString().padStart(2, '0')}:00 UTC`}
              </dd>
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

      {/* --- Notifications Section --- */}
      <section className={styles.profileSection}>
          <h3>Notifications</h3>
          {isCheckingNotifications ? (
              <p>Checking notification status...</p>
          ) : notificationError ? (
              <p className={styles.errorMessage}>{notificationError}</p>
          ) : (
              <div>
                  {notificationsEnabled ? (
                      <>
                          <p>Push notifications are currently enabled on this device.</p>
                          <button 
                              className={styles.testButton} 
                              onClick={handleTestSendClick} 
                              disabled={isSendingTest} 
                              title="Send the current Verse of the Day notification to all subscribers"
                          >
                              {isSendingTest ? 'Sending Test...' : 'Send Test Notification'}
                          </button>
                      </>
                  ) : (
                      <>
                          <p>Enable push notifications to receive updates (e.g., Verse of the Day).</p>
                          <button 
                              className={styles.notificationButton} 
                              onClick={handleSubscribeClick} 
                              disabled={isSubscribing}
                          >
                              {isSubscribing ? 'Enabling...' : 'Enable Notifications'}
                          </button>
                      </>
                  )}
              </div>
          )}
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