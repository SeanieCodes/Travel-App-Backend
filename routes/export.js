const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const exportController = require('../controllers/exportController');

router.post('/trip/pdf', auth, exportController.generateTripPDF);

router.post('/trip/email', auth, exportController.emailTripPDF);

module.exports = router;