import webpush from 'web-push';
import { logger } from './logger.js';
import User from '../models/User.js'; // Import User model

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (!vapidPublicKey || !vapidPrivateKey) {
    logger.error('[Push Config] VAPID keys are not defined in environment variables. Push notifications will not work.');
} else {
    webpush.setVapidDetails(
        'mailto:kodyeandrews@gmail.com', // REQUIRED: Replace with your contact email
        vapidPublicKey,
        vapidPrivateKey
    );
    logger.info('[Push Config] Web Push VAPID details configured.');
}

/**
 * Sends a push notification payload to all valid subscriptions of all users.
 * @param {object} payload The payload to send (e.g., { title, body, icon, url }).
 */
export async function sendNotificationsToAll(payload) {
    logger.info(`[Push Send] Attempting to send notification to all subscribers. Payload: ${JSON.stringify(payload)}`);

    try {
        // Find all users who have at least one push subscription
        const usersWithSubscriptions = await User.find({ 
            'pushSubscriptions.0': { $exists: true } 
        });

        if (usersWithSubscriptions.length === 0) {
            logger.info('[Push Send] No users with active subscriptions found.');
            return;
        }

        logger.info(`[Push Send] Found ${usersWithSubscriptions.length} users with subscriptions.`);

        const sendPromises = [];
        const subscriptionsToRemove = []; // Keep track of expired subscriptions

        usersWithSubscriptions.forEach(user => {
            user.pushSubscriptions.forEach(subscription => {
                // Create a promise for each send attempt
                const sendPromise = webpush.sendNotification(
                    subscription,
                    JSON.stringify(payload) // Payload must be a string
                )
                .then(response => {
                    logger.info(`[Push Send] Notification sent successfully to ${subscription.endpoint.substring(0, 40)}... Status: ${response.statusCode}`);
                })
                .catch(error => {
                    logger.error(`[Push Send] Error sending notification to ${subscription.endpoint.substring(0, 40)}... Status: ${error.statusCode}, Message: ${error.body}`);
                    // Check for expired/invalid subscriptions (410 Gone, 404 Not Found)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        logger.warn(`[Push Send] Subscription ${subscription.endpoint.substring(0, 40)}... is expired or invalid. Queuing for removal.`);
                        subscriptionsToRemove.push({ userId: user._id, endpoint: subscription.endpoint });
                    }
                    // We don't re-throw here, just log the error for this specific sub
                });
                sendPromises.push(sendPromise);
            });
        });

        // Wait for all send attempts to complete (or fail)
        await Promise.allSettled(sendPromises);
        logger.info('[Push Send] All notification send attempts completed.');

        // --- Cleanup Expired Subscriptions --- 
        if (subscriptionsToRemove.length > 0) {
            logger.info(`[Push Send] Removing ${subscriptionsToRemove.length} expired/invalid subscriptions.`);
            // Group removals by user for efficiency
            const removalsByUser = subscriptionsToRemove.reduce((acc, removal) => {
                if (!acc[removal.userId]) {
                    acc[removal.userId] = [];
                }
                acc[removal.userId].push(removal.endpoint);
                return acc;
            }, {});

            const cleanupPromises = Object.entries(removalsByUser).map(([userId, endpoints]) => {
                return User.updateOne(
                    { _id: userId }, 
                    { $pull: { pushSubscriptions: { endpoint: { $in: endpoints } } } }
                );
            });
            
            await Promise.allSettled(cleanupPromises);
            logger.info('[Push Send] Expired subscription cleanup finished.');
        }

    } catch (error) {
        logger.error('[Push Send] General error fetching users or sending notifications:', error);
    }
}

/**
 * Sends a push notification payload to a specific user's valid subscriptions.
 * @param {string} userId The ID of the user to send the notification to.
 * @param {object} payload The payload to send (e.g., { title, body, icon, url }).
 */
export async function sendNotificationToUser(userId, payload) {
    if (!userId) {
        logger.error('[Push Send User] No userId provided.');
        return;
    }
    logger.info(`[Push Send User] Attempting to send notification to user ${userId}. Payload: ${JSON.stringify(payload)}`);

    try {
        const user = await User.findById(userId).select('pushSubscriptions'); // Only select needed field

        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            logger.info(`[Push Send User] User ${userId} not found or has no active subscriptions.`);
            return;
        }

        logger.info(`[Push Send User] Found ${user.pushSubscriptions.length} subscriptions for user ${userId}.`);

        const sendPromises = [];
        const subscriptionsToRemove = []; // Keep track of expired subscriptions for this user

        user.pushSubscriptions.forEach(subscription => {
            const sendPromise = webpush.sendNotification(
                subscription,
                JSON.stringify(payload)
            )
            .then(response => {
                logger.info(`[Push Send User] Notification sent successfully to ${subscription.endpoint.substring(0, 40)}... for user ${userId}. Status: ${response.statusCode}`);
            })
            .catch(error => {
                logger.error(`[Push Send User] Error sending notification to ${subscription.endpoint.substring(0, 40)}... for user ${userId}. Status: ${error.statusCode}, Message: ${error.body}`);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    logger.warn(`[Push Send User] Subscription ${subscription.endpoint.substring(0, 40)}... for user ${userId} is expired or invalid. Queuing for removal.`);
                    // Pass the full subscription object for easier removal
                    subscriptionsToRemove.push(subscription.endpoint);
                }
            });
            sendPromises.push(sendPromise);
        });

        await Promise.allSettled(sendPromises);
        logger.info(`[Push Send User] All notification send attempts completed for user ${userId}.`);

        // --- Cleanup Expired Subscriptions for this User --- 
        if (subscriptionsToRemove.length > 0) {
            logger.info(`[Push Send User] Removing ${subscriptionsToRemove.length} expired/invalid subscriptions for user ${userId}.`);
            try {
                 await User.updateOne(
                    { _id: userId },
                    { $pull: { pushSubscriptions: { endpoint: { $in: subscriptionsToRemove } } } }
                );
                logger.info(`[Push Send User] Expired subscription cleanup finished for user ${userId}.`);
            } catch (cleanupError) {
                 logger.error(`[Push Send User] Error cleaning up subscriptions for user ${userId}:`, cleanupError);
            }
           
        }

    } catch (error) {
        logger.error(`[Push Send User] General error sending notifications to user ${userId}:`, error);
    }
}

export default webpush; 