const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Traditional login route
router.post('/login', authController.login);

// Google authentication route
router.post('/google/verify', authController.verifyGoogleToken);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;