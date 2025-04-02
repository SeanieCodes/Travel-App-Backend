const pdfService = require('../services/pdfService');
const emailService = require('../services/emailService');
const User = require('../models/User');
const TravelPlan = require('../models/TravelPlan');

// Helper function to prepare trip data
const prepareTripData = async (userId, tripDates) => {
  // Get user and travel plan data
  const user = await User.findById(userId);
  const travelPlan = await TravelPlan.findOne({ userId });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (!travelPlan) {
    throw new Error('No travel plans found');
  }
  
  // Convert arrays to maps for easier lookup
  const cityDatesMap = {};
  travelPlan.cityDates.forEach(item => {
    cityDatesMap[item.date] = item.cityName;
  });
  
  const activitiesMap = {};
  travelPlan.dateActivities.forEach(item => {
    activitiesMap[item.date] = item.activities;
  });
  
  // Extract trip info
  const tripActivities = {};
  tripDates.forEach(date => {
    tripActivities[date] = activitiesMap[date] || [];
  });
  
  // Get city name (should be the same for all dates in the trip)
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

// Generate and download PDF for a specific trip
exports.generateTripPDF = async (req, res) => {
  try {
    const { dates } = req.body;
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Valid trip dates are required' });
    }
    
    const { user, trip } = await prepareTripData(req.user.id, dates);
    
    // Generate PDF
    const pdfBuffer = await pdfService.generateTripPDF(user, trip);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=alcove_trip_${trip.cityName.replace(/\s+/g, '_').toLowerCase()}.pdf`);
    
    // Send PDF as response
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting trip PDF:', error);
    res.status(500).json({ message: 'Failed to generate trip PDF', error: error.message });
  }
};

// Generate PDF and send via email for a specific trip
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
    
    // Generate PDF
    const pdfBuffer = await pdfService.generateTripPDF(user, trip);
    
    // Send email with PDF attachment
    await emailService.sendTripEmail(user, trip.cityName, pdfBuffer);
    
    res.json({ message: `Trip itinerary for ${trip.cityName} has been sent to your email` });
  } catch (error) {
    console.error('Error sending trip PDF via email:', error);
    res.status(500).json({ message: 'Failed to send trip PDF via email', error: error.message });
  }
};