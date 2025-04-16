import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true, // Removes whitespace from both ends
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Ensure emails are unique
    lowercase: true, // Store emails in lowercase
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'], // Basic email format validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'], // Example: enforce minimum length
  },
  denomination: {
    type: String,
    trim: true,
    default: 'Prefer not to say', // Set a default value
  },
  lastReadBook: {
    type: String,
    default: 'Genesis' // Default to Genesis if not set
  },
  lastReadChapter: {
    type: Number,
    default: 1 // Default to chapter 1 if not set
  },
  // --- Bookmark Fields ---
  bookmarkedBook: {
    type: String,
    default: null // No default bookmark
  },
  bookmarkedChapter: {
    type: Number,
    default: null // No default bookmark
  },
  // --- Push Notification Subscriptions --- 
  pushSubscriptions: [
    {
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Pre-save hook for password hashing could be added here later
// userSchema.pre('save', async function(next) { ... });

const User = mongoose.model('User', userSchema);

export default User; 