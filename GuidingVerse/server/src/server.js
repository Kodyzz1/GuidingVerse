// server/src/server.js
import express from 'express';
import cors from 'cors';
import bibleRoutes from './routes/bibleRoutes.js'; // Make sure this is uncommented

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.get('/', (req, res) => {
  res.send('GuidingVerse Backend is running!');
});

// Mount the Bible API routes - This tells Express to use bibleRoutes
// for any path starting with /api/bible
app.use('/api/bible', bibleRoutes); // Make sure this is uncommented

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`GuidingVerse server running on http://localhost:${PORT}`);
});