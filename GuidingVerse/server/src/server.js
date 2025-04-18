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
  const currentUTCHour = new Date().getUTCHours(); // Still useful for logging the task run time
  const now = new Date(); // Get the full current time for accurate local conversion
  logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Running notification check...`);

  try {
    // Find users who have set a timezone and local hour preference
    const usersToNotify = await User.find({
      notificationTimezone: { $ne: null }, // Must have timezone set
      preferredLocalNotificationHour: { $ne: null }, // Must have hour set
      'pushSubscriptions.0': { $exists: true } 
    }).select('_id pushSubscriptions notificationTimezone preferredLocalNotificationHour'); 

    if (usersToNotify.length === 0) {
      logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] No users with timezone/hour preferences found.`);
      return;
    }

    logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Found ${usersToNotify.length} users with preferences.`);

    // Get the current VOTD details
    const { votd, date: votdDate, dateStringForToday } = getStoredVOTDDetails();

    // Check if VOTD is available and for the current date
    if (!votd || votdDate !== dateStringForToday) {
      logger.warn(`[Hourly Task - ${currentUTCHour}:00 UTC] VOTD not available or not for today (${dateStringForToday}). Skipping notifications. Stored date: ${votdDate}`);
      return;
    }

    // Prepare payload (only needs to be done once)
    const notificationText = votd.text.length > 100 
        ? votd.text.substring(0, 97) + '...' 
        : votd.text;
    const payload = {
      title: 'Verse of the Day',
      body: `"${notificationText}" - ${votd.book} ${votd.chapter}:${votd.verse}`,
      icon: '/icons/icon-192x192.png',
      url: `/reader?book=${encodeURIComponent(votd.book)}&chapter=${votd.chapter}` 
    };
    logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Prepared VOTD Payload for ${votd.book} ${votd.chapter}:${votd.verse}`);

    // Check each user's preference against the current time in their timezone
    const sendTasks = [];
    usersToNotify.forEach(user => {
        try {
            // Format the *current* time (UTC) into the user's specified timezone
            const formatter = new Intl.DateTimeFormat('en-US', { // locale doesn't significantly matter for hour extraction
                timeZone: user.notificationTimezone,
                hour: 'numeric', // Get the hour
                hour12: false    // Use 24-hour format (0-23)
            });
            
            // Extract the hour part correctly (formatToParts is safer)
            const parts = formatter.formatToParts(now);
            const currentLocalHourPart = parts.find(part => part.type === 'hour');
            
            if (!currentLocalHourPart) {
                 logger.error(`[Hourly Task] Could not extract hour for timezone ${user.notificationTimezone} for user ${user._id}`);
                 return; // Skip this user
            }
            
            // Handle potential 24 -> 0 issue if Intl returns 24 for midnight
            let currentLocalHour = parseInt(currentLocalHourPart.value, 10);
            if (currentLocalHour === 24) {
                currentLocalHour = 0; // Treat 24 as 0 (start of the day)
            }

            // Check if the current local hour matches the user's preference
            if (currentLocalHour === user.preferredLocalNotificationHour) {
                logger.info(`[Hourly Task] Match found for user ${user._id}. Current local hour (${user.notificationTimezone}): ${currentLocalHour}, Preferred: ${user.preferredLocalNotificationHour}. Queueing notification.`);
                // Queue the task to send the notification to this specific user
                sendTasks.push(sendNotificationToUser(user._id, payload)); 
            } 
            // else {
            //      logger.debug(`[Hourly Task] No match for user ${user._id}. Current local hour (${user.notificationTimezone}): ${currentLocalHour}, Preferred: ${user.preferredLocalNotificationHour}`);
            // }
        } catch (tzError) {
            // Log error if the timezone name is invalid
            logger.error(`[Hourly Task] Error processing timezone '${user.notificationTimezone}' for user ${user._id}:`, tzError);
            // Consider setting user's timezone preference back to null here?
            // User.findByIdAndUpdate(user._id, { $set: { notificationTimezone: null, preferredLocalNotificationHour: null } }).catch(err => logger.error('Failed to reset invalid timezone', err));
        }
    });

    // Wait for all queued send tasks to settle
    if (sendTasks.length > 0) {
        await Promise.allSettled(sendTasks);
        logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] Finished processing ${sendTasks.length} notification sends.`);
    } else {
        logger.info(`[Hourly Task - ${currentUTCHour}:00 UTC] No users matched the current hour.`);
    }

  } catch (error) {
    // Add closing backtick and improve message
    logger.error(`[Hourly Task - ${currentUTCHour}:00 UTC] Error during notification check:`, error);
  }
}

// ... rest of the code ...

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => { // Add '0.0.0.0' as the hostname
  logger.info(`Server running on port ${PORT}`);
});