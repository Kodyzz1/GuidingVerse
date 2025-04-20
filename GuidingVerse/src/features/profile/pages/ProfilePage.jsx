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

// ADD: Helper to format 24-hour number to 12-hour AM/PM string
function formatHour12(hour24) {
    if (hour24 === null || hour24 === undefined) return 'Off';
    const hour = parseInt(hour24, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) return 'Invalid';

    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12; // Convert 0 to 12 for 12 AM, 12 to 12 for 12 PM
    return `${hour12}:00 ${ampm}`;
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
    preferredLocalNotificationHour: null,
    detectedTimezone: ''
  });
  const [isLoading, setIsLoading] = useState(false); // For save loading state
  const [error, setError] = useState(null); // For API errors
  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isCheckingNotifications, setIsCheckingNotifications] = useState(true);
  const [notificationError, setNotificationError] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  // ADD: State for password change form
  const [passwordData, setPasswordData] = useState({ 
      currentPassword: '', 
      newPassword: '', 
      confirmNewPassword: '' 
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

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

  // --- Effect to initialize form data and detect timezone ---
  useEffect(() => {
    let detectedTz = '';
    try {
      detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
      console.warn('Could not detect browser timezone:', e);
      // Optionally set an error state or default
    }

    if (user) {
      setFormData({
        username: user.name || '',
        email: user.email || '',
        denomination: user.denomination || 'Prefer not to say',
        preferredLocalNotificationHour: user.preferredLocalNotificationHour !== undefined ? user.preferredLocalNotificationHour : null,
        detectedTimezone: detectedTz || ''
      });
    } else {
      // If no user, still set the detected timezone for potential use
       setFormData(prev => ({ ...prev, detectedTimezone: detectedTz || '' }));
    }
    // Only re-run if the user object changes (timezone detection runs once)
  }, [user]); 

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
    setError(null); 
    if (user) {
      // Also detect timezone again when entering edit mode, in case it changed?
      let detectedTz = '';
      try {
          detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (e) { console.warn('Could not detect browser timezone on edit start:', e); }
      
      setFormData({
        username: user.name || '',
        email: user.email || '',
        denomination: user.denomination || 'Prefer not to say',
        preferredLocalNotificationHour: user.preferredLocalNotificationHour !== undefined ? user.preferredLocalNotificationHour : null,
        detectedTimezone: detectedTz || ''
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
    // Handle the select for notification hour specifically
    if (name === 'preferredLocalNotificationHour') {
        setFormData(prevData => ({
            ...prevData,
            // Store null if "Off" is selected, otherwise parse the number
            [name]: value === '' ? null : parseInt(value, 10)
        }));
    } else {
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    }
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
    
    // Check if notification preference changed
    const currentPrefHour = user.preferredLocalNotificationHour !== undefined ? user.preferredLocalNotificationHour : null;
    const currentPrefTz = user.notificationTimezone || null; // Get current timezone pref
    const formHour = formData.preferredLocalNotificationHour; // Already number or null
    const formTz = formData.detectedTimezone || null; // Use the detected timezone

    // Send if hour changed OR if turning preference on/off (hour becomes null/non-null)
    // Also send timezone if preference is being turned ON (hour is not null)
    if (formHour !== currentPrefHour) { 
        changedData.preferredLocalNotificationHour = formHour;
        // If the preference is being set (not turned off), also send the detected timezone
        if (formHour !== null) {
             changedData.notificationTimezone = formTz;
        } else {
             // If turning off, explicitly set timezone to null on backend too
             changedData.notificationTimezone = null;
        }
    } else if (formHour !== null && formTz !== currentPrefTz) {
        // Handle case where only the detected timezone changed while hour preference remained the same (and not null)
        // This is less common, but good to update the stored timezone if the user's system changed.
        changedData.notificationTimezone = formTz;
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
                preferredLocalNotificationHour: data.preferredLocalNotificationHour,
                notificationTimezone: data.notificationTimezone,
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

  // ADD: Handler for password input changes
  const handlePasswordInputChange = (event) => {
      const { name, value } = event.target;
      setPasswordData(prev => ({ ...prev, [name]: value }));
      setPasswordError(null); // Clear errors on input change
      setPasswordSuccess(null); // Clear success message
  };

  // ADD: Handler for submitting the password change
  const handleChangePassword = async (event) => {
      event.preventDefault();
      setPasswordError(null);
      setPasswordSuccess(null);
      setIsChangingPassword(true);

      // Client-side validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
          setPasswordError('Please fill in all password fields.');
          setIsChangingPassword(false);
          return;
      }
      if (passwordData.newPassword.length < 6) {
           setPasswordError('New password must be at least 6 characters long.');
           setIsChangingPassword(false);
           return;
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          setPasswordError('New passwords do not match.');
          setIsChangingPassword(false);
          return;
      }
      if (passwordData.currentPassword === passwordData.newPassword) {
            setPasswordError('New password cannot be the same as the current password.');
            setIsChangingPassword(false);
            return;
      }

      try {
          const token = localStorage.getItem('guidingVerseToken');
          if (!token) throw new Error('Authentication token not found.');

          const response = await fetch('/api/auth/change-password', {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                  currentPassword: passwordData.currentPassword,
                  newPassword: passwordData.newPassword
                  // No need to send confirmNewPassword to backend
              })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'Failed to change password.');
          }

          setPasswordSuccess('Password changed successfully!');
          // Clear the form fields on success
          setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
          // Optionally, redirect or display a persistent success message?

      } catch (err) {
          console.error('[ChangePassword] Error:', err);
          setPasswordError(err.message || 'An error occurred while changing password.');
      } finally {
          setIsChangingPassword(false);
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

              {/* --- Update Preferred Notification Hour Dropdown --- */}
              <label htmlFor="preferredLocalNotificationHour">VOTD Notification Time:</label>
              <div> { /* Wrap select and timezone info */}
                <select
                  id="preferredLocalNotificationHour"
                  name="preferredLocalNotificationHour"
                  value={formData.preferredLocalNotificationHour === null ? '' : formData.preferredLocalNotificationHour}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                >
                  <option value="">Off</option> { /* Represents null */}
                  {/* Generate 12-hour options but keep 24-hour value */}
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {/* Display 12-hour format */}
                      {formatHour12(i)} 
                    </option>
                  ))}
                </select>
                {/* Display detected timezone */}
                {formData.detectedTimezone && (
                    <span className={styles.timezoneInfo}>
                        (Your Local Time - Zone: {formData.detectedTimezone})
                    </span>
                )}
              </div>
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

              {/* Update Display Preferred Notification Hour */}
              <dt>VOTD Notification Time:</dt>
              <dd>
                {/* Use formatter for display */}
                {formatHour12(user.preferredLocalNotificationHour)}
                {/* Optionally display the stored timezone */} 
                {user.notificationTimezone && user.preferredLocalNotificationHour !== null && (
                    <span className={styles.timezoneDisplay}> (Local Timezone: {user.notificationTimezone})</span>
                )}
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

      {/* --- Security Section --- */}
      <section className={styles.profileSection}>
          <h3>Security</h3>
          {/* Display messages */}
          {passwordError && <p className={styles.errorMessage}>{passwordError}</p>}
          {passwordSuccess && <p className={styles.successMessage}>{passwordSuccess}</p>}

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword}>
             <div className={styles.formGrid}> 
                <label htmlFor="currentPassword">Current Password:</label>
                <input 
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    className={styles.formInput}
                    required
                    autoComplete="current-password"
                />

                <label htmlFor="newPassword">New Password:</label>
                <input 
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    className={styles.formInput}
                    required
                    minLength={6}
                    autoComplete="new-password"
                />

                <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                <input 
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordInputChange}
                    className={styles.formInput}
                    required
                    minLength={6}
                    autoComplete="new-password"
                />
             </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.saveButton} disabled={isChangingPassword}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
             </div>
          </form>
      </section>
      
    </div>
  );
}

export default ProfilePage;