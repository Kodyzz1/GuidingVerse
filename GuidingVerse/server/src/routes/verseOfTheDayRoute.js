import express from 'express';
import { logger } from '../utils/logger.js';
import { getCurrentVOTD } from '../utils/votdService.js';

const router = express.Router();

// --- Route Handler --- //
router.get('/', async (req, res) => {
  try {
    // Get the VOTD from the service (generates if needed)
    const verseOfTheDay = await getCurrentVOTD(); 

    if (!verseOfTheDay) {
        logger.error('[GET /verse-of-the-day] VOTD Service returned null.');
        // Determine appropriate error status based on why it might be null
        // For now, use 503 Service Unavailable, as the service couldn't provide the data
        return res.status(503).json({ 
            message: 'Verse of the Day is currently unavailable. Please try again later.',
            error: 'VOTD service failed to provide data.' 
        });
    }

    // Send the VOTD obtained from the service
    res.json(verseOfTheDay);

  } catch (error) {
      // Catch any unexpected errors during the service call
    logger.error('[GET /verse-of-the-day] Unexpected error processing request:', error);
    res.status(500).json({ message: 'Internal server error processing verse of the day.', error: error.message });
  }
});

export default router; 