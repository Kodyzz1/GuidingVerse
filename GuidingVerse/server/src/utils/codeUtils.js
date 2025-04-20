import crypto from 'crypto';
import User from '../models/User.js'; // Need User model for checking uniqueness

const FRIEND_CODE_LENGTH = 5;
const FRIEND_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generates a unique friend code.
 * @param {number} [maxAttempts=10] - Maximum attempts to find a unique code.
 * @returns {Promise<string>} - The unique friend code.
 * @throws {Error} - If a unique code cannot be generated within maxAttempts.
 */
export async function generateUniqueFriendCode(maxAttempts = 10) {
    let friendCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < maxAttempts) {
        friendCode = '';
        try {
            const randomBytes = crypto.randomBytes(FRIEND_CODE_LENGTH);
            for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
                friendCode += FRIEND_CODE_CHARS[randomBytes[i] % FRIEND_CODE_CHARS.length];
            }
        } catch (e) {
            console.warn('crypto.randomBytes not available, falling back to Math.random for friend code generation.');
             for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
                friendCode += FRIEND_CODE_CHARS[Math.floor(Math.random() * FRIEND_CODE_CHARS.length)];
             }
        }

        // Check if the generated code already exists
        const existingUser = await User.findOne({ friendCode: friendCode }).lean(); 
        if (!existingUser) {
            isUnique = true;
        } else {
            console.warn(`Friend code collision detected: ${friendCode}. Regenerating...`);
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error(`Failed to generate a unique friend code after ${maxAttempts} attempts.`);
    }

    return friendCode;
} 