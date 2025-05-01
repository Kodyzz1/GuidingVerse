// --- Imports ---
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http'; // Need http module
import { Server as SocketIOServer } from 'socket.io'; // Import socket.io server
import bibleRoutes from './routes/bibleRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import interpretationRoutes from './routes/interpretationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import verseOfTheDayRoute from './routes/verseOfTheDayRoute.js';
import notificationRoutes from './routes/notificationRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import User from './models/User.js';
import { sendNotificationToUser } from './utils/pushNotifications.js';
import { getStoredVOTDDetails, getCurrentVOTD } from './utils/votdService.js';

// Load environment variables
dotenv.config();

// --- Connect to Database ---
connectDB();

// --- Configuration ---
const PORT = process.env.PORT || 3000;

// --- Initialize Express App ---
const app = express();
const server = http.createServer(app); // Create HTTP server

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

// --- Initialize Socket.IO ---
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins, // Use the same allowed origins as Express CORS
    methods: ["GET", "POST"],
    credentials: true
  }
});

// --- User Tracking for Sockets ---
const onlineUsers = new Map(); // Map<userId, socketId>

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  logger.info(`[Socket.IO] User connected: ${socket.id}`);

  // Placeholder: Need to associate userId with socket.id upon authentication/connection
  // For now, we'll just log connection/disconnection

  socket.on('disconnect', () => {
    logger.info(`[Socket.IO] User disconnected: ${socket.id}`);
    // Remove user from onlineUsers map upon disconnect
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        disconnectedUserId = userId;
        logger.info(`[Socket.IO] Removed user ${userId} from online list`);
        // TODO: Optionally, notify friends that this user went offline?
        break;
      }
    }
    // TODO: Notify friends about disconnection if disconnectedUserId is not null
    // if (disconnectedUserId) {
    //   notifyFriendsOfStatusChange(disconnectedUserId, false); // false for offline
    // }
  });

  // Placeholder for handling user authentication via socket
  // Client should emit 'authenticate' with its JWT token after connecting/logging in
  socket.on('authenticate', (token) => {
      // TODO: Implement token verification and user association
      // Example (requires jwt library and token verification logic):
      /*
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId; // Adjust based on your JWT payload
        if (userId) {
          onlineUsers.set(userId.toString(), socket.id);
          logger.info(`[Socket.IO] Authenticated user ${userId} associated with socket ${socket.id}`);
          // TODO: Optionally confirm successful authentication back to the client
          socket.emit('authenticated'); 
          // TODO: Notify friends that this user is now online
          // notifyFriendsOfStatusChange(userId, true); // true for online
        } else {
           logger.warn(`[Socket.IO] Invalid token payload for socket ${socket.id}`);
           socket.emit('authentication_failed', { message: 'Invalid token payload.' });
        }
      } catch (err) {
         logger.warn(`[Socket.IO] Failed authentication attempt for socket ${socket.id}: ${err.message}`);
         // Optionally disconnect if authentication fails, or just inform the client
         socket.emit('authentication_failed', { message: 'Invalid or expired token.' });
         // socket.disconnect(true); 
      }
      */
     logger.info(`[Socket.IO] Received 'authenticate' event from ${socket.id} (token verification not yet implemented)`);
  });

  // Placeholder for future events
  // socket.on('some_event', (data) => { ... });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/bible', bibleRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interpret', interpretationRoutes);
app.use('/api/verse-of-the-day', verseOfTheDayRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api/friends', friendRoutes);
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
    // --- Ensure VOTD for today is generated --- 
    // Call getCurrentVOTD first. This will trigger the generation logic 
    // in votdService if the date has changed or if it's the first run.
    const ensuredVOTD = await getCurrentVOTD();
    if (!ensuredVOTD) {
        logger.error(`[Hourly Task - ${currentUTCHour}:00 UTC] Failed to ensure VOTD was generated. Skipping task run.`);
        return; // Cannot proceed without a VOTD
    }
    // ----------------------------------------

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
    logger.debug(`[Hourly Task] VOTD Details: Stored Date='${votdDate}', Today='${dateStringForToday}', VOTD Present=${!!votd}`);

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
    logger.debug(`[Hourly Task] Checking ${usersToNotify.length} users against current time: ${now.toISOString()}`);
    usersToNotify.forEach(user => {
        const userTz = user.notificationTimezone;
        const userHourPref = user.preferredLocalNotificationHour;
        logger.debug(`[Hourly Task] Checking User ${user._id}: PrefHour=${userHourPref}, PrefTZ='${userTz}'`);
        try {
            // Format the *current* time (UTC) into the user's specified timezone
            const formatter = new Intl.DateTimeFormat('en-US', { 
                timeZone: userTz,
                hour: 'numeric', 
                hour12: false    
            });
            
            // Extract the hour part correctly
            const parts = formatter.formatToParts(now);
            const currentLocalHourPart = parts.find(part => part.type === 'hour');
            
            if (!currentLocalHourPart) {
                 logger.error(`[Hourly Task] Could not extract hour for timezone ${userTz} for user ${user._id}`);
                 return; // Skip this user
            }
            
            let currentLocalHour = parseInt(currentLocalHourPart.value, 10);
            if (currentLocalHour === 24) currentLocalHour = 0; // Handle Intl returning 24 for midnight

            logger.debug(`[Hourly Task] User ${user._id}: Current local hour in '${userTz}' is ${currentLocalHour}. Comparing with preference ${userHourPref}.`);

            // Check if the current local hour matches the user's preference
            if (currentLocalHour === userHourPref) {
                logger.info(`[Hourly Task] Match found for user ${user._id}. Current local hour (${userTz}): ${currentLocalHour}, Preferred: ${userHourPref}. Queueing notification.`);
                sendTasks.push(sendNotificationToUser(user._id, payload)); 
            } 
            // else {
            //     logger.debug(`[Hourly Task] No match for user ${user._id}. Current local hour (${userTz}): ${currentLocalHour}, Preferred: ${userHourPref}`);
            // }
        } catch (tzError) {
            logger.error(`[Hourly Task] Error processing timezone '${userTz}' for user ${user._id}:`, tzError);
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

// Run the check once shortly after server start, then set the interval
setTimeout(() => {
    // ADD: Basic console log to confirm callback execution
    console.log('!!! setTimeout for Hourly Notification Task Entered !!!'); 
    logger.info('[Server Startup] Running initial notification check...');
    runHourlyNotificationCheck(); 
    setInterval(runHourlyNotificationCheck, ONE_HOUR_MS);
    logger.info('[Server Startup] Hourly notification check interval started.');
}, 5000); // Run 5 seconds after start

// --- Start Server ---
server.listen(PORT, '0.0.0.0', () => { // Add '0.0.0.0' as the hostname
  logger.info(`Server running on port ${PORT}`);
});

// Export io instance and onlineUsers map for use in other modules (like authRoutes)
export { io, onlineUsers };