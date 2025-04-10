import { getRandomVerse } from '../utils/randomVerse';

// Get a random verse
router.get('/random-verse', (req, res) => {
  try {
    const verse = getRandomVerse();
    if (verse) {
      res.json(verse);
    } else {
      res.status(500).json({ error: 'Failed to get random verse' });
    }
  } catch (error) {
    console.error('Error in random verse endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}); 