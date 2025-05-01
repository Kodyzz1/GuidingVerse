// --- Imports ---
import {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef // Add useRef for socket instance
} from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client'; // Import socket.io client
import { ToastContainer, toast } from 'react-toastify'; // Import react-toastify

// --- Context Creation ---
const AuthContext = createContext(null);

// --- Socket Server URL (Adjust if needed) ---
// Assumes server is running on the same host/port or configured via proxy
const SOCKET_SERVER_URL = '/'; // Use relative path

// --- Provider Component ---
export function AuthProvider({ children }) {
  // --- State ---
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial auth check
  const socketRef = useRef(null); // Use ref for socket instance to avoid re-renders on change

  // --- Effect for Initial Auth Check ---
  useEffect(() => {
    // Check localStorage for persisted user data on initial load
    try {
      const storedUser = localStorage.getItem('guidingVerseUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Include last read AND bookmark info
        setUser({
          id: parsedUser.id,
          name: parsedUser.name,
          email: parsedUser.email,
          denomination: parsedUser.denomination,
          friendCode: parsedUser.friendCode,
          preferredLocalNotificationHour: parsedUser.preferredLocalNotificationHour,
          notificationTimezone: parsedUser.notificationTimezone,
          lastReadBook: parsedUser.lastReadBook || 'Genesis',
          lastReadChapter: parsedUser.lastReadChapter || 1,
          bookmarkedBook: parsedUser.bookmarkedBook || null, // Add bookmark
          bookmarkedChapter: parsedUser.bookmarkedChapter || null // Add bookmark
        });
        setIsAuthenticated(true);
        console.log('Auth state (incl. bookmark) loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      localStorage.removeItem('guidingVerseUser'); // Clear corrupted data
    } finally {
      setIsLoading(false); // Finished initial check
    }
  }, []); // Run only once on mount

  // --- Effect for Socket.IO Connection Management ---
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // User is logged in, establish connection if not already connected
      if (!socketRef.current) {
        console.log('[Socket.IO] Authenticated, attempting to connect...');
        const token = localStorage.getItem('guidingVerseToken');
        if (!token) {
          console.error('[Socket.IO] Cannot connect: Auth token not found.');
          // Handle this case - maybe logout? Force refresh?
          return;
        }

        // Connect to the server, passing the token for authentication
        const newSocket = io(SOCKET_SERVER_URL, {
          auth: { token }
        });

        socketRef.current = newSocket; // Store the socket instance in the ref

        // --- Standard Socket Event Listeners ---
        newSocket.on('connect', () => {
          console.log(`[Socket.IO] Connected successfully! Socket ID: ${newSocket.id}`);
          // Optionally emit an event here if needed upon successful connection/authentication
          // e.g., newSocket.emit('user_online', { userId: user.id });
        });

        newSocket.on('disconnect', (reason) => {
          console.log(`[Socket.IO] Disconnected. Reason: ${reason}`);
          socketRef.current = null; // Clear the ref on disconnect
          // Handle potential reconnection logic here if needed
        });

        newSocket.on('connect_error', (error) => {
          console.error(`[Socket.IO] Connection Error: ${error.message}`, error);
          // Handle connection errors (e.g., server down, invalid token)
          // Maybe attempt reconnection after a delay, or notify the user
          socketRef.current?.disconnect(); // Ensure cleanup on connection error
          socketRef.current = null;
          // Consider logging out the user if the token is rejected repeatedly
          // logout();
        });

        // --- Custom Application Event Listeners ---
        newSocket.on('friend_logged_in', (data) => {
          console.log('[Socket.IO] Received friend_logged_in event:', data);
          // Use toast notification instead of alert
          toast.info(`${data.username} just logged in!`);
          // alert(`Friend logged in: ${data.username} (ID: ${data.userId})`); // Basic alert for now - REMOVED
        });

      }
    } else {
      // User is not authenticated, disconnect if connected
      if (socketRef.current) {
        console.log('[Socket.IO] User logged out or unauthenticated, disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null; // Clear the ref
      }
    }

    // --- Cleanup Function ---
    // Runs when the component unmounts OR when dependencies (isAuthenticated, user?.id) change BEFORE the effect runs again.
    return () => {
      if (socketRef.current) {
        console.log('[Socket.IO] Cleaning up socket connection on effect re-run or unmount.');
        // Remove specific listeners to prevent memory leaks if the socket instance itself isn't being destroyed immediately
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('friend_logged_in');
        // Only disconnect if the intention is to fully close the connection (e.g., on logout/unmount)
        // If the effect is just re-running due to auth change, the logic above handles disconnect/connect.
        // However, disconnecting here ensures cleanup if the component unmounts while connected.
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]); // Re-run when auth state or user ID changes

  // --- Auth Functions (Real Implementation) ---
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', { // Assumes proxy or same origin
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      // Include last read AND bookmark info
      const userData = {
          id: data._id,
          name: data.username,
          email: data.email,
          denomination: data.denomination,
          friendCode: data.friendCode,
          preferredLocalNotificationHour: data.preferredLocalNotificationHour,
          notificationTimezone: data.notificationTimezone,
          lastReadBook: data.lastReadBook || 'Genesis',
          lastReadChapter: data.lastReadChapter || 1,
          bookmarkedBook: data.bookmarkedBook || null,
          bookmarkedChapter: data.bookmarkedChapter || null
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData));
      // --- STORE THE TOKEN ---
      if (data.token) {
          localStorage.setItem('guidingVerseToken', data.token);
          console.log('Auth token stored in localStorage.');
          // *** Trigger socket connection attempt AFTER token is stored and state is set ***
          // The useEffect hook dependent on isAuthenticated will handle the connection.
      } else {
          console.warn('No token received from login endpoint.');
      }
      // -----------------------
      console.log('Login successful, user state (incl. bookmark) updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Login API call failed:', error);
      // Clear any potentially outdated user state on login failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
      localStorage.removeItem('guidingVerseToken'); // Clear token on failed login
      throw error; // Re-throw the error so LoginPage can catch it and display message
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Signup Function --- //
  const signup = useCallback(async (username, email, password, denomination) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', { // Assumes proxy or same origin
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, denomination }),
      });

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Throw error with message from backend if available
        throw new Error(data.message || `Signup failed with status ${response.status}`);
      }

       // Include last read AND bookmark info (defaults to null for new users)
      const userData = {
          id: data._id,
          name: data.username,
          email: data.email,
          denomination: data.denomination,
          friendCode: data.friendCode,
          preferredLocalNotificationHour: data.preferredLocalNotificationHour,
          notificationTimezone: data.notificationTimezone,
          lastReadBook: data.lastReadBook || 'Genesis',
          lastReadChapter: data.lastReadChapter || 1,
          bookmarkedBook: data.bookmarkedBook || null,
          bookmarkedChapter: data.bookmarkedChapter || null
      };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('guidingVerseUser', JSON.stringify(userData));
      // --- STORE THE TOKEN ---
      if (data.token) {
          localStorage.setItem('guidingVerseToken', data.token);
          console.log('Auth token stored in localStorage after signup.');
          // *** Trigger socket connection attempt AFTER token is stored and state is set ***
          // The useEffect hook dependent on isAuthenticated will handle the connection.
      } else {
          console.warn('No token received from register endpoint.');
      }
      // -----------------------
      console.log('Signup successful, user logged in, state (incl. bookmark) updated & persisted.');
      return true; // Indicate success

    } catch (error) {
      console.error('Signup API call failed:', error);
      // Ensure user state is cleared if signup fails after a potential previous login
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guidingVerseUser');
      localStorage.removeItem('guidingVerseToken'); // Clear token on failed signup
      throw error; // Re-throw the error so SignupPage can catch it and display message
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    // Explicitly disconnect socket BEFORE clearing auth state
    if (socketRef.current) {
        console.log('[AuthContext Logout] Disconnecting socket before logging out.');
        socketRef.current.disconnect();
        socketRef.current = null;
    }
    // TODO: Add API call to backend logout endpoint if needed (e.g., to invalidate tokens)
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('guidingVerseUser'); // Clear persisted data
    localStorage.removeItem('guidingVerseToken'); // <-- Clear token on logout
    console.log('User logged out, state and token cleared.');
    setIsLoading(false);
    return true;
  }, []);

  // --- Bookmark Function --- //
  const setBookmark = useCallback(async (book, chapter) => {
    // console.log('[AuthContext] setBookmark START', { book, chapter }); // <-- REMOVE
    if (!isAuthenticated || !user) {
      // console.warn('[AuthContext] setBookmark EXIT - User not authenticated.', {isAuthenticated, hasUser: !!user}); // <-- REMOVE
      return false;
    }
    // console.log('[AuthContext] setBookmark User authenticated. Checking token...'); // <-- REMOVE
    setIsLoading(true); // <-- UNCOMMENT
    try {
      const token = localStorage.getItem('guidingVerseToken');
      // console.log('[AuthContext] setBookmark token from localStorage:', token ? '*** (exists)' : 'null or undefined'); // <-- REMOVE
      if (!token) {
          // console.error('[AuthContext] setBookmark EXIT - Token not found in localStorage.'); // <-- REMOVE
        throw new Error('Authentication token not found.');
      }

      // console.log('[AuthContext] setBookmark Making FETCH call...'); // <-- REMOVE
      const response = await fetch('/api/auth/bookmark', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ book, chapter }),
      });
      // console.log('[AuthContext] setBookmark FETCH response status:', response.status); // <-- REMOVE

      const data = await response.json();

      if (!response.ok) {
          // console.error('[AuthContext] setBookmark FETCH failed:', data.message); // <-- REMOVE
        throw new Error(data.message || 'Failed to update bookmark on server');
      }

      // Update local state and localStorage
      const updatedUserData = { ...user, bookmarkedBook: book, bookmarkedChapter: chapter };
      // console.log('[AuthContext] Before setUser:', user); // Optional: Log state before update
      setUser(updatedUserData);
      localStorage.setItem('guidingVerseUser', JSON.stringify(updatedUserData));
      console.log('[AuthContext] SUCCESS: Local state & localStorage updated with:', updatedUserData.bookmarkedBook, updatedUserData.bookmarkedChapter); // <-- ADD THIS LOG
      // console.log('[AuthContext] SUCCESS: Local state & localStorage updated with:', { bookmarkedBook: updatedUserData.bookmarkedBook, bookmarkedChapter: updatedUserData.bookmarkedChapter }); // Alternative format
      // console.log('[AuthContext] setBookmark SUCCESS (local & server):', book, chapter); // <-- REMOVE
      return true;

    } catch (error) {
      // console.error('[AuthContext] setBookmark CATCH block error:', error); // <-- REMOVE
      // Keep console.error for actual operational errors if desired, or remove this too
      console.error('Failed to save bookmark:', error.message); // Keep a user-facing error log maybe?
      return false;
    } finally {
      setIsLoading(false); // <-- UNCOMMENT
      // console.log('[AuthContext] setBookmark FINALLY block.'); // <-- REMOVE
    }
  }, [user, isAuthenticated]); // Add dependencies

  // --- Function to update parts of user state locally ---
  // Useful for non-critical updates like last read without full re-fetch
  const updateUserState = useCallback((updatedFields) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      // Ensure we don't accidentally overwrite the new fields if they aren't in updatedFields
      const newUserState = { 
          ...currentUser, 
          ...updatedFields, // This merges the updates
          // Explicitly include potentially updated notification fields if they exist in updatedFields,
          // otherwise keep the current ones. This is implicitly handled by the spread above,
          // but being explicit might be clearer for complex cases.
          // preferredLocalNotificationHour: updatedFields.preferredLocalNotificationHour !== undefined ? updatedFields.preferredLocalNotificationHour : currentUser.preferredLocalNotificationHour,
          // notificationTimezone: updatedFields.notificationTimezone !== undefined ? updatedFields.notificationTimezone : currentUser.notificationTimezone
      };
      
      // Also update localStorage so reloads reflect the change
      localStorage.setItem('guidingVerseUser', JSON.stringify(newUserState));
      console.log('[AuthContext] updateUserState updated state and localStorage:', updatedFields);
      return newUserState;
    });
  }, []); // No dependencies needed as it only uses the setter

  // --- Memoized Context Value ---
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    signup,
    setBookmark,
    updateUserState // <-- Add updateUserState to context value
    // socket: socketRef.current // Optionally provide socket instance - use with caution
  }), [user, isAuthenticated, isLoading, login, logout, signup, setBookmark, updateUserState]); // Add updateUserState dependency

  // --- Provider JSX ---
  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        null
      ) : (
        children
      )}
      {/* Add ToastContainer here for global notifications */}
      <ToastContainer
        position="bottom-right" // Example position
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // Example theme
      />
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
  if (context === null) { // Handle the initial null state before provider initializes
      // This might happen briefly on initial render.
      // Return a default shape or handle appropriately depending on requirements.
      // console.warn("AuthContext is null, returning default state");
      return {
          user: null,
          isAuthenticated: false,
          isLoading: true,
          login: () => Promise.reject(new Error("AuthProvider not ready")),
          logout: () => Promise.reject(new Error("AuthProvider not ready")),
          signup: () => Promise.reject(new Error("AuthProvider not ready")),
          setBookmark: () => Promise.reject(new Error("AuthProvider not ready")),
          updateUserState: () => {},
          // socket: null
      };
  }
  return context;
};