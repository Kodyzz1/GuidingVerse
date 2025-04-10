// --- Imports ---
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import bibleRoutes from './routes/bibleRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import interpretationRoutes from './routes/interpretationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// --- Connect to Database ---
connectDB();

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize Express App ---
const app = express();

// --- Middleware ---
// Configure CORS to allow specific origins
const allowedOrigins = [
  process.env.CORS_ORIGIN,
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interpret', interpretationRoutes);

// --- Serve Static Frontend Files (for Production) ---
const rootDir = process.cwd();
const publicPath = path.join(rootDir, 'public');
app.use(express.static(publicPath));

// --- Catch-all for client-side routing ---
app.get('*', (req, res) => {
  res.sendFile(path.resolve(publicPath, 'index.html'));
});

// --- Error Handling Middleware ---
app.use(errorHandler);

// --- Start Server ---
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});