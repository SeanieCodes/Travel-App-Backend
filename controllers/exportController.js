const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const User = require('../models/User');
const TravelPlan = require('../models/TravelPlan');

const prepareTripData = async (userId, tripDates) => {
  const user = await User.findById(userId);
  const travelPlan = await TravelPlan.findOne({ userId });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!travelPlan) {
    throw new Error('No travel plans found');
  }
  
  const cityDatesMap = {};
  travelPlan.cityDates.forEach(item => {
    cityDatesMap[item.date] = item.cityName;
  });
  
  const activitiesMap = {};
  travelPlan.dateActivities.forEach(item => {
    activitiesMap[item.date] = item.activities;
  });
  
  const tripActivities = {};
  tripDates.forEach(date => {
    tripActivities[date] = activitiesMap[date] || [];
  });
  
  const cityName = cityDatesMap[tripDates[0]];
  
  return {
    user,
    trip: {
      cityName,
      dates: tripDates,
      activities: tripActivities
    }
  };
};

exports.generateTripPDF = async (req, res) => {
  try {
    const { dates } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Valid trip dates are required' });
    }
    
    const { user, trip } = await prepareTripData(req.user.id, dates);
    
    const pdfBuffer = await pdfService.generateTripPDF(user, trip);

    const safeFilename = `alcove_trip_${trip.cityName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting trip PDF:', error);
    res.status(500).json({ message: 'Failed to generate trip PDF', error: error.message });
  }
};

exports.emailTripPDF = async (req, res) => {
  try {
    const { dates } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Valid trip dates are required' });
    }
    
    const { user, trip } = await prepareTripData(req.user.id, dates);
    
    if (!user.email) {
      return res.status(400).json({ message: 'User email is required for sending itinerary' });
    }
    
    const pdfBuffer = await pdfService.generateTripPDF(user, trip);
    
    await emailService.sendTripEmail(user, trip.cityName, pdfBuffer);
    
    res.json({ message: `Trip itinerary for ${trip.cityName} has been sent to your email` });
  } catch (error) {
    console.error('Error sending trip PDF via email:', error);
    res.status(500).json({ message: 'Failed to send trip PDF via email', error: error.message });
  }
};