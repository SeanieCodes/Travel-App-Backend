const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/itinerary-suggestions', auth, aiController.getItinerarySuggestions);

module.exports = router;