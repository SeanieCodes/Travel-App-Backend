const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TravelPlan = require('../models/TravelPlan');

// Get user's travel plan
router.get('/', auth, async (req, res) => {
  try {
    let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
    
    if (!travelPlan) {
      // Create empty travel plan if none exists
      travelPlan = new TravelPlan({
        userId: req.user.id,
        cityDates: [],
        dateActivities: []
      });
      await travelPlan.save();
    }
    
    res.json(travelPlan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user's travel plan
router.put('/', auth, async (req, res) => {
  try {
    const { cityDates, dateActivities } = req.body;
    
    // Find and update travel plan
    let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
    
    if (!travelPlan) {
      travelPlan = new TravelPlan({
        userId: req.user.id,
        cityDates,
        dateActivities,
      });
    } else {
      travelPlan.cityDates = cityDates;
      travelPlan.dateActivities = dateActivities;
      travelPlan.updatedAt = Date.now();
    }
    
    const savedPlan = await travelPlan.save();
    res.json(savedPlan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;