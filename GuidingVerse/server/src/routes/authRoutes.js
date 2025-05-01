import express from 'express';
import bcrypt from 'bcryptjs'; // Use standard import name
import jwt from 'jsonwebtoken'; // <-- Import jsonwebtoken
import User from '../models/User.js'; // Import the User model
import { protect } from '../middleware/authMiddleware.js'; // Assuming protect middleware exists
import { generateUniqueFriendCode } from '../utils/codeUtils.js';
import { io, onlineUsers } from '../server.js'; // Import socket.io instance and online users map
import { logger } from '../utils/logger.js'; // Import logger

const router = express.Router();

// --- Helper function to generate JWT ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Example expiration: 30 days
  });
};

// --- Route Handlers (Placeholders) --- //

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, denomination } = req.body;
  console.log('Register Request Body:', { username, email, password: '[HIDDEN]', denomination }); // Log safely

  try {
    // --- Basic Validation ---
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password.' });
    }
    // Mongoose schema validation (email format, password length) will also run on save

    // --- Check if user exists --- //
    let existingUser = await User.findOne({ email: email.toLowerCase() }); // Case-insensitive check
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // --- Hash Password --- //
    const salt = await bcrypt.genSalt(10); // Generate salt (10 rounds is standard)
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Generate Friend Code ---
    let friendCode;
    try {
        friendCode = await generateUniqueFriendCode();
    } catch (codeError) {
        console.error('Failed to generate friend code:', codeError);
        return res.status(500).json({ message: 'Server error generating unique user identifier.' });
    }
    // -------------------------

    // --- Create and Save New User --- //
    const newUser = new User({
      username,
      email, // Email is already lowercased by schema
      password: hashedPassword,
      denomination: denomination || 'Prefer not to say', // Use provided or default
      friendCode: friendCode // Assign the generated code
    });

    await newUser.save(); // Mongoose handles validation here

    console.log('User registered successfully:', newUser.email);

    // --- Send Success Response (INCLUDE TOKEN and Friend Code) --- //
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      denomination: newUser.denomination,
      friendCode: newUser.friendCode, // Add friend code to response
      notificationTimezone: newUser.notificationTimezone, // Include notification prefs
      preferredLocalNotificationHour: newUser.preferredLocalNotificationHour,
      lastReadBook: newUser.lastReadBook,        
      lastReadChapter: newUser.lastReadChapter,    
      bookmarkedBook: newUser.bookmarkedBook,      
      bookmarkedChapter: newUser.bookmarkedChapter, 
      createdAt: newUser.createdAt,
      token: generateToken(newUser._id) 
    });

  } catch (error) {
    console.error('Registration Error:', error);
    // Handle Mongoose validation errors (e.g., invalid email, password too short)
    if (error.name === 'ValidationError') {
      // Extract specific validation messages if needed
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(' ') });
    }
    // Handle other potential errors (database connection, etc.)
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login Request Body:', { email, password: '[HIDDEN]' });

  try {
    // --- Basic Validation ---
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    // --- Find User by Email --- //
    const user = await User.findOne({ email: email.toLowerCase() }); 

    // --- Check if User Exists --- //
    if (!user) {
      console.log('Login failed: User not found for email:', email.toLowerCase());
      return res.status(401).json({ message: 'Invalid credentials.' }); 
    }

    // --- Compare Passwords --- //
    const isMatch = await bcrypt.compare(password, user.password); 

    if (isMatch) {
      // --- Login Successful --- //
      logger.info(`[POST /api/auth/login] User logged in successfully: ${user.email}`); // Use logger

      // --- Check and Generate Friend Code if Missing --- //
      let userFriendCode = user.friendCode;
      if (!userFriendCode) {
          console.log(`User ${user.email} is missing friendCode. Generating one...`);
          try {
              userFriendCode = await generateUniqueFriendCode();
              user.friendCode = userFriendCode; 
              await user.save(); // Save the updated user with the new code
              console.log(`Generated and saved friendCode ${userFriendCode} for user ${user.email}`);
          } catch (codeError) {
              // Log the error but proceed with login if possible, friend features might fail later
              console.error(`Failed to generate/save friend code for user ${user.email} during login:`, codeError);
              // Optionally, return an error or continue without the code?
              // For now, we proceed, but the friendCode in response might be null/undefined
              userFriendCode = null; // Ensure it's null if generation failed
          }
      }
      // --------------------------------------------------- //

      // --- Notify Online Friends --- //
      try {
        // Ensure friends list is populated for the logged-in user
        // We need the full user object with populated friends here
        const loggedInUserWithFriends = await User.findById(user._id).select('friends username').populate('friends', '_id'); // Populate friend IDs

        if (loggedInUserWithFriends && loggedInUserWithFriends.friends && loggedInUserWithFriends.friends.length > 0) {
          logger.info(`[Socket.IO] User ${loggedInUserWithFriends.username} (${user._id}) logged in. Notifying ${loggedInUserWithFriends.friends.length} friends.`);

          loggedInUserWithFriends.friends.forEach(friend => {
            const friendId = friend._id.toString();
            const friendSocketId = onlineUsers.get(friendId); // Check the onlineUsers map

            if (friendSocketId) {
              logger.info(`[Socket.IO] Friend ${friendId} is online (socket ${friendSocketId}). Sending 'friend_logged_in' notification.`);
              // Send notification to the specific friend's socket
              io.to(friendSocketId).emit('friend_logged_in', {
                userId: user._id, // ID of the user who logged in
                username: loggedInUserWithFriends.username, // Username of the user who logged in
                timestamp: new Date().toISOString()
              });
            } else {
              logger.debug(`[Socket.IO] Friend ${friendId} is offline. Skipping notification.`);
            }
          });
        } else {
          logger.debug(`[Socket.IO] User ${user._id} has no friends or friends list could not be populated.`);
        }
      } catch (notifyError) {
         logger.error(`[Socket.IO] Error notifying friends for user ${user._id}:`, notifyError);
         // Non-fatal error, login should still succeed. Consider if this needs more robust handling.
      }
      // ----------------------------- //

      // --- Send Success Response (including friendCode) --- //
      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        denomination: user.denomination,
        friendCode: userFriendCode, // Use the potentially newly generated code
        lastReadBook: user.lastReadBook,       
        lastReadChapter: user.lastReadChapter,   
        bookmarkedBook: user.bookmarkedBook,     
        bookmarkedChapter: user.bookmarkedChapter,
        createdAt: user.createdAt,
        token: generateToken(user._id) 
      });
    } else {
      logger.warn(`[POST /api/auth/login] Login failed: Password mismatch for email: ${email.toLowerCase()}`); // Use logger
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

  } catch (error) {
    console.error('Login Error:', error);
    // Handle Mongoose errors during user.save() if friend code generation happened
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: `Error saving generated friend code: ${messages.join(' ')}` });
    }
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  // The 'protect' middleware already found the user and attached it to req.user
  // We just need to send back the relevant details.
  try {
    // req.user is populated by the protect middleware
    const user = req.user; 

    if (!user) {
      // This shouldn't happen if protect middleware worked, but good practice to check
      return res.status(404).json({ message: 'User not found.' });
    }

    // Send back profile data (excluding password)
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      denomination: user.denomination,
      lastReadBook: user.lastReadBook,
      lastReadChapter: user.lastReadChapter,
      bookmarkedBook: user.bookmarkedBook,
      bookmarkedChapter: user.bookmarkedChapter,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('[API GET /profile] Error:', error);
    res.status(500).json({ message: 'Server error retrieving profile.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { username, email, denomination, password, notificationTimezone, preferredLocalNotificationHour } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Prepare updates object
    const updates = {};
    if (username) updates.username = username;
    if (email) {
        // Add validation for email format if desired
        // Check if email is already taken by another user
        const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
        if (emailExists) {
            return res.status(400).json({ message: 'Email already in use by another account.' });
        }
        updates.email = email; // Schema will lowercase it
    }
    if (denomination) updates.denomination = denomination;

    // Add update logic for new fields
    if (notificationTimezone !== undefined) {
        // Basic check if it looks like a timezone string (e.g., contains '/'). Robust validation is hard.
        // Can be null.
        if (notificationTimezone === null || (typeof notificationTimezone === 'string' && notificationTimezone.includes('/'))) {
            updates.notificationTimezone = notificationTimezone;
        } else {
            console.warn(`[API PUT /profile] Invalid notificationTimezone (${notificationTimezone}) received for user ${userId}. Ignoring.`);
        }
    }
     if (preferredLocalNotificationHour !== undefined) {
      if (preferredLocalNotificationHour === null || (typeof preferredLocalNotificationHour === 'number' && preferredLocalNotificationHour >= 0 && preferredLocalNotificationHour <= 23 && Number.isInteger(preferredLocalNotificationHour))) {
        updates.preferredLocalNotificationHour = preferredLocalNotificationHour;
      } else {
        console.warn(`[API PUT /profile] Invalid preferredLocalNotificationHour (${preferredLocalNotificationHour}) received for user ${userId}. Ignoring.`);
      }
    }

    // Handle password update separately (requires hashing)
    if (password) {
      if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
      console.log(`[API PUT /profile] Updating password for user: ${user.email}`);
    }

    // Apply updates
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates }, 
        { new: true, runValidators: true } // Return updated doc, run schema validators
    ).select('-password'); // Exclude password hash from response

    console.log(`[API PUT /profile] Profile updated successfully for user: ${updatedUser.email}`);

    // Respond with updated profile data (and potentially a new token if email/critical info changed? Optional)
    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        denomination: updatedUser.denomination,
        notificationTimezone: updatedUser.notificationTimezone,
        preferredLocalNotificationHour: updatedUser.preferredLocalNotificationHour,
        lastReadBook: updatedUser.lastReadBook,
        lastReadChapter: updatedUser.lastReadChapter,
        bookmarkedBook: updatedUser.bookmarkedBook,
        bookmarkedChapter: updatedUser.bookmarkedChapter,
        createdAt: updatedUser.createdAt,
        // OPTIONAL: Generate a new token if you want sessions to reflect changes immediately
        // token: generateToken(updatedUser._id)
    });

  } catch (error) {
    console.error('[API PUT /profile] Error:', error);
     // Handle specific errors like validation errors
     if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(' ') });
      }
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// @route   PUT /api/auth/last-read
// @desc    Update user's last read location
// @access  Private
router.put('/last-read', protect, async (req, res) => {
  const { book, chapter } = req.body;

  // Basic validation
  if (!book || typeof book !== 'string' || !chapter || typeof chapter !== 'number') {
    return res.status(400).json({ message: 'Invalid book or chapter provided.' });
  }

  try {
    const userId = req.user._id; // Get user ID from protect middleware
    
    // Find user and update their last read location
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { lastReadBook: book, lastReadChapter: chapter },
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Send back a success response (optional, could just send 200 OK)
    res.status(200).json({
      message: 'Last read location updated successfully.',
      // Optionally send back the updated fields or user
      // lastReadBook: updatedUser.lastReadBook,
      // lastReadChapter: updatedUser.lastReadChapter
    });

  } catch (error) {
    console.error('[API PUT /last-read] Error:', error);
    res.status(500).json({ message: 'Server error updating reading history.' });
  }
});

// @route   PUT /api/auth/bookmark
// @desc    Update user's bookmarked location
// @access  Private
router.put('/bookmark', protect, async (req, res) => {
  const { book, chapter } = req.body;
  const userId = req.user._id; // Get user ID from protect middleware

  // Basic validation
  if (!book || typeof book !== 'string' || !chapter || typeof chapter !== 'number') {
    return res.status(400).json({ message: 'Invalid book or chapter provided for bookmark.' });
  }

  try {
    // Find user and update their bookmark
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bookmarkedBook: book, bookmarkedChapter: chapter },
      { new: true } // Return the updated document
    ).select('-password'); // Exclude password

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Send back a success response
    res.status(200).json({
      message: 'Bookmark updated successfully.',
      bookmarkedBook: updatedUser.bookmarkedBook,
      bookmarkedChapter: updatedUser.bookmarkedChapter
    });

  } catch (error) {
    console.error('[API PUT /bookmark] Error:', error);
    res.status(500).json({ message: 'Server error updating bookmark.' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Please provide current and new passwords.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
    }

    try {
        // Need to fetch user WITH password hash to compare
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' }); // Should not happen if protect works
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update the password in the database
        user.password = hashedNewPassword;
        await user.save(); // Use save to trigger potential pre-save hooks if any

        console.log(`[API PUT /change-password] Password changed successfully for user: ${user.email}`);
        res.status(200).json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('[API PUT /change-password] Error:', error);
        // Handle potential validation errors from save() if pre-save hooks are added
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(' ') });
        }
        res.status(500).json({ message: 'Server error changing password.' });
    }
});

export default router; 