import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';
import { sendNotificationsToAll } from '../utils/pushNotifications.js'; // Import sender
// Need verse fetching logic dependencies
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// --- Path calculation for verse data (Duplicated from verseOfTheDayRoute - consider refactoring later) ---
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);
const isProduction = process.env.NODE_ENV === 'production';
// Adjust path based on location relative to data (routes -> src -> data)
const relativeDataPath = isProduction ? '../data' : '../data'; 
const baseDataPath = path.resolve(currentDir, relativeDataPath);
let verseList = []; // Keep a local copy or re-read, simple re-read for now might be ok
let verseListError = null;
async function loadVerseList() {
  const listPath = path.join(baseDataPath, 'verse_list.json');
  try {
    const data = await fs.readFile(listPath, 'utf-8');
    verseList = JSON.parse(data);
    logger.info('[NotificationRoutes] Test Send - Verse list loaded');
  } catch (err) {
    verseListError = `Failed to load verse list for test send: ${err.message}`;
    logger.error('[NotificationRoutes] Test Send - Verse list load failed', err);
    verseList = [];
  }
}
loadVerseList(); // Load on init
// --- End Duplicated Logic ---


// @route   GET /api/notifications/vapid-public-key
// @desc    Get the VAPID public key
// @access  Public (or Private if you only want logged-in users to see it)
router.get('/vapid-public-key', (req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
        logger.error('[GET /vapid-public-key] VAPID_PUBLIC_KEY is not set in environment variables.');
        return res.status(500).json({ message: 'VAPID public key not configured on server.' });
    }
    res.status(200).json({ publicKey });
});

// @route   POST /api/notifications/subscribe
// @desc    Save push notification subscription for the user
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
    const subscription = req.body;
    const userId = req.user._id;

    // Basic validation of subscription object structure
    if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        logger.warn(`[POST /subscribe] Invalid subscription object received for user ${userId}`);
        return res.status(400).json({ message: 'Invalid subscription object provided.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if this subscription endpoint already exists for the user
        const existingSubscription = user.pushSubscriptions.find(
            sub => sub.endpoint === subscription.endpoint
        );

        if (existingSubscription) {
            logger.info(`[POST /subscribe] Subscription endpoint already exists for user ${userId}: ${subscription.endpoint}`);
            return res.status(200).json({ message: 'Subscription already exists.' });
        }

        // Add the new subscription
        user.pushSubscriptions.push(subscription);
        await user.save();

        logger.info(`[POST /subscribe] New subscription saved for user ${userId}: ${subscription.endpoint}`);
        res.status(201).json({ message: 'Subscription saved successfully.' });

    } catch (error) {
        logger.error(`[POST /subscribe] Error saving subscription for user ${userId}: ${error}`);
        res.status(500).json({ message: 'Server error saving push subscription.' });
    }
});

// @route   POST /api/notifications/test-send
// @desc    Fetches current VOTD and sends it as a push notification
// @access  Private
router.post('/test-send', protect, async (req, res) => {
    logger.info(`[POST /test-send] Request received from user ${req.user._id}`);

    // --- Re-fetch Verse of the Day Logic (Simplified from verseOfTheDayRoute) ---
    if (verseListError || verseList.length === 0) {
        logger.error('[POST /test-send] Verse list not available.');
        return res.status(500).json({ message: 'Verse list not available for test send.' });
    }

    let verseOfTheDay;
    try {
        const randomIndex = Math.floor(Math.random() * verseList.length);
        const targetVerseRef = verseList[randomIndex];
        if (!targetVerseRef) throw new Error('Selected verse reference is invalid.');

        const bibleJsonPath = path.join(baseDataPath, 'BibleJSON/JSON');
        const chapterFilePath = path.join(bibleJsonPath, targetVerseRef.book, `${targetVerseRef.chapter}.json`);
        const chapterFileContent = await fs.readFile(chapterFilePath, 'utf-8');
        const chapterData = JSON.parse(chapterFileContent);
        const verseData = chapterData?.verses?.find(v => v.verse === targetVerseRef.verse);
        if (!verseData) throw new Error(`Verse ${targetVerseRef.verse} not found.`);

        verseOfTheDay = {
            book: targetVerseRef.book,
            chapter: targetVerseRef.chapter,
            verse: verseData.verse,
            text: verseData.text,
        };
        logger.info(`[POST /test-send] Fetched verse for test: ${verseOfTheDay.book} ${verseOfTheDay.chapter}:${verseOfTheDay.verse}`);
    
    } catch (error) {
        logger.error('[POST /test-send] Error fetching verse of the day for test send:', error);
        return res.status(500).json({ message: 'Failed to fetch verse data for test notification.', error: error.message });
    }
    // --- End Verse Fetching Logic ---

    // --- Prepare and Send Notification --- 
    try {
        const notificationText = verseOfTheDay.text.length > 100 
            ? verseOfTheDay.text.substring(0, 97) + '...' 
            : verseOfTheDay.text;
            
        const payload = {
            title: 'Verse of the Day (Test)', // Add (Test)
            body: `"${notificationText}" - ${verseOfTheDay.book} ${verseOfTheDay.chapter}:${verseOfTheDay.verse}`,
            icon: '/icons/icon-192x192.png',
            url: `/reader?book=${encodeURIComponent(verseOfTheDay.book)}&chapter=${verseOfTheDay.chapter}` 
        };
        
        // Send (don't wait)
        sendNotificationsToAll(payload).catch(err => {
            logger.error("[POST /test-send] Background notification send failed:", err);
        }); 

        res.status(200).json({ message: 'Test notification triggered successfully.', sentVerse: `${verseOfTheDay.book} ${verseOfTheDay.chapter}:${verseOfTheDay.verse}` });

    } catch (notificationError) {
        logger.error("[POST /test-send] Error preparing or triggering notification send:", notificationError);
        res.status(500).json({ message: 'Error triggering notification send.' });
    }
    // ---------------------------------
});

// TODO: Add a DELETE /unsubscribe endpoint later for cleanup

export default router; 