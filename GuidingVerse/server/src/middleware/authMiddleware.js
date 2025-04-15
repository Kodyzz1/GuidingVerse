import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler'; // For cleaner async error handling
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for Authorization header and Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split 'Bearer <token>')
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token's ID and attach to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        logger.warn(`[Auth Protect] User not found for token ID: ${decoded.id}`);
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      logger.info(`[Auth Protect] User authenticated: ${req.user.email}`);
      next(); // Proceed to the next middleware/route handler
    } catch (error) {
      logger.error(`[Auth Protect] Token verification failed: ${error.message}`);
      res.status(401); // Unauthorized
      // Customize error message based on JWT error type if needed
      if (error.name === 'JsonWebTokenError') {
          throw new Error('Not authorized, invalid token');
      } else if (error.name === 'TokenExpiredError') {
          throw new Error('Not authorized, token expired');
      } else {
          throw new Error('Not authorized, token failed');
      }
    }
  }

  if (!token) {
    logger.warn('[Auth Protect] No token found in request');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

export { protect }; 