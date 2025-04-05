// server/src/server.js
import express from 'express';
// We'll import routes later
// import bibleRoutes from './routes/bibleRoutes.js';

// Create the Express app
const app = express();

// Define the port the server will listen on
// Use environment variable or default to 3001 (to avoid conflicts with frontend)
const PORT = process.env.PORT || 3001;

// --- Middleware ---
// Enable Express to parse JSON request bodies (useful for potential future POST routes)
app.use(express.json());

// Add CORS middleware later if needed when calling from frontend dev server
// import cors from 'cors';
// app.use(cors()); // Example basic CORS setup

// --- Routes ---

// Simple root route for testing if the server is up
app.get('/', (_req, res) => {
  res.send('GuidingVerse Backend is running!');
});

// Mount the Bible API routes (we will create this file next)
// All routes defined in bibleRoutes.js will be prefixed with /api/bible
// app.use('/api/bible', bibleRoutes);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`GuidingVerse server running on http://localhost:${PORT}`);
});