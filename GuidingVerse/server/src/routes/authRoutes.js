import express from 'express';
import bcrypt from 'bcryptjs'; // Use standard import name
import User from '../models/User.js'; // Import the User model

const router = express.Router();

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

    // --- Create and Save New User --- //
    const newUser = new User({
      username,
      email, // Email is already lowercased by schema
      password: hashedPassword,
      denomination: denomination || 'Prefer not to say', // Use provided or default
    });

    await newUser.save(); // Mongoose handles validation here

    console.log('User registered successfully:', newUser.email);

    // --- Send Success Response (Exclude password) --- //
    // Important: Don't send the password hash back to the client
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      denomination: newUser.denomination,
      createdAt: newUser.createdAt
      // Potentially add JWT token generation here later
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
// @desc    Authenticate user & potentially get token later
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
    // Mongoose's findOne is case-sensitive by default for strings unless schema specifies lowercase: true
    const user = await User.findOne({ email: email.toLowerCase() }); 

    // --- Check if User Exists --- //
    if (!user) {
      console.log('Login failed: User not found for email:', email.toLowerCase());
      // Use a generic message for security (don't reveal if email exists)
      return res.status(401).json({ message: 'Invalid credentials.' }); 
    }

    // --- Compare Passwords --- //
    const isMatch = await bcrypt.compare(password, user.password); // Compare plain text password with hash

    if (!isMatch) {
      console.log('Login failed: Password mismatch for email:', email.toLowerCase());
      // Use a generic message for security
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // --- Login Successful --- //
    console.log('User logged in successfully:', user.email);

    // --- Send Success Response (Exclude password) --- //
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      denomination: user.denomination,
      createdAt: user.createdAt,
      // TODO: Generate and include JWT token here for session management
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

export default router; 