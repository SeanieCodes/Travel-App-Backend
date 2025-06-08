const aiService = require('../services/aiService');

exports.getItinerarySuggestions = async (req, res) => {
  try {
    const { city, dates, preferences } = req.body;
    if (!city || !dates?.length) {
      return res.status(400).json({ message: 'city and dates are required' });
    }

    const suggestion = await aiService.generateItinerary(city, dates, preferences);
    res.json({ suggestion });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ message: 'Failed to generate itinerary suggestions' });
  }
};