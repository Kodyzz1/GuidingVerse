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
import verseOfTheDayRoute from './routes/verseOfTheDayRoute.js';
import notificationRoutes from './routes/notificationRoutes.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import User from './models/User.js';
import { sendNotificationToUser } from './utils/pushNotifications.js';
import { getStoredVOTDDetails } from './utils/votdService.js';

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
  process.env.CORS_ORIGIN,          // Render domain (from .env.production or Render env)
  process.env.CUSTOM_DOMAIN_WWW,    // Production www domain (from .env.production or Render env)
  process.env.CUSTOM_DOMAIN_ROOT,   // Production root domain (from .env.production or Render env)
  process.env.CLIENT_ORIGIN_DEV     // Development client domain (from .env)
].filter(Boolean); // Filter out undefined/null values

console.log('[Server] Allowed CORS Origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      console.warn(`[CORS Blocked] Origin: ${origin}`);
      return callback(new Error(msg), false);
    }
    return callback(null, true);
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
app.use('/api/verse-of-the-day', verseOfTheDayRoute);
app.use('/api/notifications', notificationRoutes);
console.log('[Server] API routes mounted.');

// --- Production-only Static Files & Catch-all ---
if (process.env.NODE_ENV === 'production') {
  console.log('[Server] Production mode detected. Configuring static file serving.');
  
  const rootDir = process.cwd(); // Should be server/ when running from dist
  const publicPath = path.join(rootDir, 'public');
  const assetsPath = path.join(publicPath, 'assets');

  // Serve static files from the 'assets' subdirectory
  console.log(`[Server] Serving /assets from: ${assetsPath}`);
  app.use('/assets', express.static(assetsPath));

  // Serve other static files (like index.html, favicon.ico) from the root of 'public'
  console.log(`[Server] Serving static root from: ${publicPath}`);
  app.use(express.static(publicPath));

  // --- Catch-all for client-side routing (MUST be AFTER static files) ---
  console.log('[Server] Enabling catch-all route for client-side routing.');
  app.get('*', (req, res) => {
    const indexPath = path.resolve(publicPath, 'index.html');
    console.log(`[Server] Catch-all: serving ${indexPath} for ${req.originalUrl}`);
    res.sendFile(indexPath);
  });
} else {
   console.log('[Server] Development mode detected. Skipping static file serving and catch-all route.');
}

// --- Error Handling Middleware (Should be last) ---
app.use(errorHandler);

// --- Hourly Notification Task ---
const ONE_HOUR_MS = 60 * 60 * 1000;

async function runHourlyNotificationCheck() {
  const currentUTCHour = new Date().getUTCHours();
  logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Running notification check...`);

  try {
    // Find users who want notifications at this hour
    const usersToNotify = await User.find({
      preferredNotificationHour: currentUTCHour,
      'pushSubscriptions.0': { $exists: true } // Ensure they have subscriptions
    }).select('_id pushSubscriptions'); // Select only necessary fields

    if (usersToNotify.length === 0) {
      logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] No users scheduled for this hour.`);
      return;
    }

    logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Found ${usersToNotify.length} users to potentially notify.`);

    // Get the current VOTD details
    const { votd, date: votdDate, dateStringForToday } = getStoredVOTDDetails();

    // Check if VOTD is available and for the current date
    if (!votd || votdDate !== dateStringForToday) {
      logger.warn(`[Hourly Task - ${currentUTCHour}:00 UTC] VOTD not available or not for today (${dateStringForToday}). Skipping notifications. Stored date: ${votdDate}`);
      return;
    }

    logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Today's VOTD (${votdDate}) is: ${votd.book} ${votd.chapter}:${votd.verse}. Preparing payload.`);

    // Prepare payload (same as before, but ensure it uses the retrieved votd)
    const notificationText = votd.text.length > 100 
        ? votd.text.substring(0, 97) + '...' 
        : votd.text;
    const payload = {
      title: 'Verse of the Day',
      body: `"${notificationText}" - ${votd.book} ${votd.chapter}:${votd.verse}`,
      icon: '/icons/icon-192x192.png',
      url: `/reader?book=${encodeURIComponent(votd.book)}&chapter=${votd.chapter}` 
    };

    // Send notification to each user individually
    const sendTasks = usersToNotify.map(user => 
      sendNotificationToUser(user._id, payload) // sendNotificationToUser handles logging and cleanup internally
    );

    await Promise.allSettled(sendTasks);
    logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Finished sending notifications to ${usersToNotify.length} users.`);

  } catch (error) {
    logger.error(`[Hourly Task - ${currentUTCHour}:00 UTC] Error during notification check:`, error);
  }
}

// Run the check once shortly after server start, then set the interval
setTimeout(() => {
    logger.info('[Server Startup] Running initial notification check...');
    runHourlyNotificationCheck(); 
    setInterval(runHourlyNotificationCheck, ONE_HOUR_MS);
    logger.info('[Server Startup] Hourly notification check interval started.');
}, 5000); // Run 5 seconds after start
// ---------------------------

// --- Start Server ---
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});