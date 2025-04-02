const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportController');

// Generate and download PDF for a specific trip
router.post('/trip/pdf', auth, exportController.generateTripPDF);

// Generate and email PDF for a specific trip
router.post('/trip/email', auth, exportController.emailTripPDF);

module.exports = router;