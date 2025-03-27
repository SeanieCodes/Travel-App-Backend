const mongoose = require('mongoose');

const cityDateSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  cityId: {
    type: String,
    required: true
  },
  cityName: {
    type: String,
    required: true
  }
});

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const dateActivitiesSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  activities: [activitySchema]
});

const travelPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cityDates: [cityDateSchema],
  dateActivities: [dateActivitiesSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const TravelPlan = mongoose.model('TravelPlan', travelPlanSchema);

module.exports = TravelPlan;