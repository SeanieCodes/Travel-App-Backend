const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TravelPlan = require('../models/TravelPlan');

router.get('/', auth, async (req, res) => {
  try {
    let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
    
    if (!travelPlan) {
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

router.put('/', auth, async (req, res) => {
  try {
    const { cityDates, dateActivities } = req.body;
    
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
      
      let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
      
      if (!travelPlan) {
        return res.status(404).json({ message: 'No travel plan found' });
      }
      
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

router.post('/shift', auth, async (req, res) => {
    try {
      const { dateMapping } = req.body;
      
      if (!dateMapping || !Array.isArray(dateMapping) || dateMapping.length === 0) {
        return res.status(400).json({ message: 'Valid dateMapping array is required' });
      }
      
      let travelPlan = await TravelPlan.findOne({ userId: req.user.id });
      
      if (!travelPlan) {
        return res.status(404).json({ message: 'No travel plan found' });
      }
      
      const dateMap = dateMapping.reduce((map, item) => {
        map[item.oldDate] = item.newDate;
        return map;
      }, {});
      
      const newCityDates = [];
      const newDateActivities = [];
      
      travelPlan.cityDates.forEach(cityDate => {
        if (dateMap[cityDate.date]) {
          newCityDates.push({
            date: dateMap[cityDate.date],
            cityId: cityDate.cityId,
            cityName: cityDate.cityName
          });
        } else if (!Object.values(dateMap).includes(cityDate.date)) {
          newCityDates.push(cityDate);
        }
      });
      
      travelPlan.dateActivities.forEach(dateActivity => {
        if (dateMap[dateActivity.date]) {
          newDateActivities.push({
            date: dateMap[dateActivity.date],
            activities: dateActivity.activities
          });
        } else if (!Object.values(dateMap).includes(dateActivity.date)) {
          newDateActivities.push(dateActivity);
        }
      });
      
      travelPlan.cityDates = newCityDates;
      travelPlan.dateActivities = newDateActivities;
      travelPlan.updatedAt = Date.now();
      
      const updatedPlan = await travelPlan.save();
      
      res.json({
        message: 'Successfully shifted trip dates',
        shiftedDates: dateMapping,
        travelPlan: updatedPlan
      });
    } catch (error) {
      console.error('Error shifting dates:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

module.exports = router;