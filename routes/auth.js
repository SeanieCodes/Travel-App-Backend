const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/login', authController.login);

router.post('/google/verify', authController.verifyGoogleToken);

router.get('/me', auth, authController.getCurrentUser);

module.exports = router;