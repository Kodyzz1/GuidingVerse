import { logger } from '../utils/logger.js';

/**
 * Basic error handling middleware.
 * Logs the error and sends a generic 500 response.
 */
export const errorHandler = (err, req, res, next) => {
  logger.error(err.stack); // Log the full error stack

  // Send a generic error response
  // Avoid sending detailed error messages in production
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
}; 