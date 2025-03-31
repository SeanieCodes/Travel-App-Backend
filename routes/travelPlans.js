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

router.delete('/dates', auth, async (req, res) => {
    try {
      const { dates } = req.body;
      
      if (!dates || !Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({ message: 'Valid dates array is required' });
      }
      
      // Find the user's travel plan
      let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
      
      if (!travelPlan) {
        return res.status(404).json({ message: 'No travel plan found' });
      }
      
      // Filter out the dates to be deleted
      travelPlan.cityDates = travelPlan.cityDates.filter(cityDate => 
        !dates.includes(cityDate.date)
      );
      
      travelPlan.dateActivities = travelPlan.dateActivities.filter(dateActivity => 
        !dates.includes(dateActivity.date)
      );
      
      travelPlan.updatedAt = Date.now();
      
      const updatedPlan = await travelPlan.save();
      res.json({
        message: 'Successfully deleted trip dates',
        deletedDates: dates,
        travelPlan: updatedPlan
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;