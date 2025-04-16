import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

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

// TODO: Add a DELETE /unsubscribe endpoint later for cleanup

export default router; 