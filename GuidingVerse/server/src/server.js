// --- Imports ---
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bibleRoutes from './routes/bibleRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
// Use standard static import for the router
import interpretationRoutes from './routes/interpretationRoutes.js';
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import connectDB from './config/db.js'; // Import the DB connection function
import 'dotenv/config'; // Ensure .env is loaded early (if not already by db.js)

// --- Connect to Database --- //
connectDB(); // Call the connection function

// --- Get __dirname equivalent ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// Mount routes synchronously
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/bible', bibleRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interpret', interpretationRoutes); // Use the imported router directly

// --- Serve Static Frontend Files (for Production) ---
// Determine the correct path to the 'public' directory relative to the built 'dist' folder
// When running the built code from 'dist/server.js', __dirname will be 'dist'
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// --- Catch-all for client-side routing ---
// This needs to be after API routes but before 404/error handlers
app.get('*', (req, res) => {
    // Send 'index.html' from the 'public' directory for any other GET request
    res.sendFile(path.resolve(publicPath, 'index.html'));
});

// --- Error Handling Middleware ---
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

app.use((err, req, res, next) => {
  console.error('Unhandled application error:', err.stack);
  res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// --- Remove async setup --- //
/*
async function startServer() { ... }
startServer();
*/