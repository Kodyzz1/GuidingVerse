import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';

const router = express.Router();

// @route   POST /api/friends/request
// @desc    Send a friend request to a user using their friend code
// @access  Private
router.post('/request', protect, asyncHandler(async (req, res) => {
    const { friendCode } = req.body;
    const senderId = req.user._id; // From protect middleware

    if (!friendCode) {
        return res.status(400).json({ message: 'Friend code is required.' });
    }

    if (friendCode === req.user.friendCode) {
        return res.status(400).json({ message: 'You cannot send a friend request to yourself.' });
    }

    try {
        // Find the recipient user by their friend code
        const recipient = await User.findOne({ friendCode });

        if (!recipient) {
            return res.status(404).json({ message: 'User with that friend code not found.' });
        }

        const recipientId = recipient._id;

        // Check if already friends
        if (req.user.friends.includes(recipientId)) {
            return res.status(400).json({ message: 'You are already friends with this user.' });
        }

        // Check if a request is already pending (either direction)
        if (req.user.pendingRequestsSent.includes(recipientId)) {
            return res.status(400).json({ message: 'Friend request already sent to this user.' });
        }
        if (req.user.pendingRequestsReceived.includes(recipientId)) {
            return res.status(400).json({ message: 'This user has already sent you a friend request. Check your pending requests.' });
        }

        // Add recipient to sender's pendingRequestsSent
        await User.findByIdAndUpdate(senderId, { $addToSet: { pendingRequestsSent: recipientId } });

        // Add sender to recipient's pendingRequestsReceived
        await User.findByIdAndUpdate(recipientId, { $addToSet: { pendingRequestsReceived: senderId } });

        logger.info(`[POST /api/friends/request] User ${senderId} sent friend request to user ${recipientId} (code: ${friendCode})`);
        res.status(200).json({ message: 'Friend request sent successfully.' });

    } catch (error) {
        logger.error(`[POST /api/friends/request] Error sending friend request from ${senderId} to code ${friendCode}:`, error);
        res.status(500).json({ message: 'Server error sending friend request.' });
    }
}));

// @route   GET /api/friends/requests/pending
// @desc    Get pending friend requests received by the user
// @access  Private
router.get('/requests/pending', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        // Find the user and populate the pendingRequestsReceived field
        // We select only the necessary fields from the users who sent requests
        const user = await User.findById(userId)
            .populate('pendingRequestsReceived', 'id username friendCode'); 

        if (!user) {
            // Should not happen if protect middleware works, but good practice
            return res.status(404).json({ message: 'User not found.' }); 
        }

        res.status(200).json(user.pendingRequestsReceived); // Send the array of user objects

    } catch (error) {
        logger.error(`[GET /api/friends/requests/pending] Error fetching pending requests for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error fetching pending friend requests.' });
    }
}));

// @route   POST /api/friends/requests/accept/:senderId
// @desc    Accept a friend request from a specific user
// @access  Private
router.post('/requests/accept/:senderId', protect, asyncHandler(async (req, res) => {
    const recipientId = req.user._id; // The user accepting the request
    const senderId = req.params.senderId;

    try {
        // Validate senderId is a valid ObjectId format if needed (Mongoose does this implicitly)
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
             return res.status(400).json({ message: 'Invalid sender ID format.' });
        }

        // Ensure the sender is actually in the recipient's pending list
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient user not found.' });
        }
        if (!recipient.pendingRequestsReceived.includes(senderId)) {
            return res.status(400).json({ message: 'No pending friend request found from this user.' });
        }

        // Ensure the recipient is in the sender's pending list (consistency check)
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: 'Sender user not found.' });
        }
        if (!sender.pendingRequestsSent.includes(recipientId)) {
             logger.warn(`[POST /accept/:senderId] Consistency issue: Sender ${senderId} does not have pending request for Recipient ${recipientId}, but Recipient has pending request from Sender. Proceeding to fix.`);
             // Allow fixing the inconsistency, or return error based on desired strictness
             // return res.status(400).json({ message: 'Request consistency mismatch.'});
        }

        // --- Perform the updates --- 
        // 1. Remove sender from recipient's pendingReceived
        // 3. Add sender to recipient's friends
        await User.findByIdAndUpdate(recipientId, {
            $pull: { pendingRequestsReceived: senderId },
            $addToSet: { friends: senderId }
        });

        // 2. Remove recipient from sender's pendingSent
        // 4. Add recipient to sender's friends
        await User.findByIdAndUpdate(senderId, {
            $pull: { pendingRequestsSent: recipientId },
            $addToSet: { friends: recipientId }
        });

        logger.info(`[POST /api/friends/requests/accept] User ${recipientId} accepted friend request from user ${senderId}`);
        res.status(200).json({ message: 'Friend request accepted successfully.' });

    } catch (error) {
        logger.error(`[POST /api/friends/requests/accept] Error accepting request from ${senderId} for user ${recipientId}:`, error);
        res.status(500).json({ message: 'Server error accepting friend request.' });
    }
}));

// @route   POST /api/friends/requests/reject/:senderId
// @desc    Reject a friend request from a specific user
// @access  Private
router.post('/requests/reject/:senderId', protect, asyncHandler(async (req, res) => {
    const recipientId = req.user._id; // The user rejecting the request
    const senderId = req.params.senderId;

    try {
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
             return res.status(400).json({ message: 'Invalid sender ID format.' });
        }

        // Ensure the sender is actually in the recipient's pending list
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ message: 'Recipient user not found.' });
        }
        if (!recipient.pendingRequestsReceived.includes(senderId)) {
            return res.status(400).json({ message: 'No pending friend request found from this user to reject.' });
        }

        // Check sender state for logging/consistency (optional but good)
        const sender = await User.findById(senderId);
        if (sender && !sender.pendingRequestsSent.includes(recipientId)) {
             logger.warn(`[POST /reject/:senderId] Consistency issue: Sender ${senderId} does not have pending request for Recipient ${recipientId}, but Recipient has pending request from Sender. Proceeding to reject.`);
        }

        // --- Perform the updates --- 
        // 1. Remove sender from recipient's pendingReceived
        await User.findByIdAndUpdate(recipientId, {
            $pull: { pendingRequestsReceived: senderId }
        });

        // 2. Remove recipient from sender's pendingSent (if sender exists)
        if (sender) {
            await User.findByIdAndUpdate(senderId, {
                $pull: { pendingRequestsSent: recipientId }
            });
        }

        logger.info(`[POST /api/friends/requests/reject] User ${recipientId} rejected friend request from user ${senderId}`);
        res.status(200).json({ message: 'Friend request rejected successfully.' });

    } catch (error) {
        logger.error(`[POST /api/friends/requests/reject] Error rejecting request from ${senderId} for user ${recipientId}:`, error);
        res.status(500).json({ message: 'Server error rejecting friend request.' });
    }
}));

// @route   GET /api/friends
// @desc    Get the list of friends for the current user
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const user = await User.findById(userId)
            .populate('friends', 'id username friendCode'); // Populate with friend details

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(user.friends); // Send the array of friend objects

    } catch (error) {
        logger.error(`[GET /api/friends] Error fetching friends for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error fetching friends list.' });
    }
}));

// @route   DELETE /api/friends/:friendId
// @desc    Remove a friend
// @access  Private
router.delete('/:friendId', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const friendId = req.params.friendId;

    try {
        if (!mongoose.Types.ObjectId.isValid(friendId)) {
             return res.status(400).json({ message: 'Invalid friend ID format.' });
        }

        // Check if they are actually friends
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Current user not found.' });
        }
        if (!user.friends.includes(friendId)) {
            return res.status(400).json({ message: 'You are not friends with this user.' });
        }

        // --- Perform the updates --- 
        // Remove friendId from the current user's friends list
        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });

        // Remove userId from the (former) friend's friends list
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        logger.info(`[DELETE /api/friends] User ${userId} removed friend ${friendId}`);
        res.status(200).json({ message: 'Friend removed successfully.' });

    } catch (error) {
        logger.error(`[DELETE /api/friends] Error removing friend ${friendId} for user ${userId}:`, error);
        // Check if the error is because the friend user was not found during the second update
        if (error instanceof mongoose.Error.DocumentNotFoundError) {
             logger.warn(`[DELETE /api/friends] Friend user ${friendId} not found while trying to remove from their list.`);
             // Decide if this is acceptable (e.g., user was deleted) or an error
             return res.status(200).json({ message: 'Friend removed from your list, but friend account may not exist.' });
        }
        res.status(500).json({ message: 'Server error removing friend.' });
    }
}));

export default router; 