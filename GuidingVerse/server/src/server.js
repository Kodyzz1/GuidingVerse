// --- Imports ---
import express from 'express';
import cors from 'cors';
import bibleRoutes from './routes/bibleRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/bible', bibleRoutes);
// Note: Mounts search routes from searchRoutes.js under /api/search
app.use('/api/search', searchRoutes);

// --- Basic Root Route ---
app.get('/', (req, res) => {
  res.send('GuidingVerse API is running!');
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// --- Error Handling Middleware ---
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});