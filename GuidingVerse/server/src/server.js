// --- Imports ---
import express from 'express';
import cors from 'cors';
import bibleRoutes from './routes/bibleRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
// Use standard static import for the router
import interpretationRoutes from './routes/interpretationRoutes.js';
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import connectDB from './config/db.js'; // Import the DB connection function
import 'dotenv/config'; // Ensure .env is loaded early (if not already by db.js)

// --- Connect to Database --- //
connectDB(); // Call the connection function

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

// --- Basic Root Route ---
app.get('/', (req, res) => {
  res.send('GuidingVerse API is running!');
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