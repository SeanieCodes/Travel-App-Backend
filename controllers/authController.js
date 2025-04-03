const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Create OAuth2 client with a consistent variable name
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email || user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.login = async (req, res) => {
  // ... your login code here ...
};

exports.verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;
    console.log('Received credential:', credential ? 'Present' : 'Missing');
    if (!credential) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    try {
      // Use oauth2Client consistently here
      const ticket = await oauth2Client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();
      if (!payload) {
        console.error('No payload found in ticket');
        return res.status(400).json({ message: 'Invalid Google token' });
      }
      const { sub: googleId, email, name: displayName, picture: profilePicture } = payload;
      console.log('Extracted payload details:', { googleId, email, displayName });
      
      // Find or create user logic...
      let user = await User.findOne({ googleId });
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = googleId;
          user.profilePicture = profilePicture;
          await user.save();
        } else {
          user = new User({
            googleId,
            email,
            displayName,
            username: email.split('@')[0],
            profilePicture
          });
          await user.save();
        }
      }
      
      const token = generateToken(user);
      res.json({
        message: 'Google authentication successful',
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.profilePicture
        }
      });
    } catch (verificationError) {
      console.error('Token Verification Error:', {
        name: verificationError.name,
        message: verificationError.message,
        stack: verificationError.stack
      });
      return res.status(400).json({
        message: 'Token verification failed',
        errorDetails: verificationError.message
      });
    }
  } catch (error) {
    console.error('Complete Google Verification Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Unexpected error during Google authentication',
      errorDetails: error.message
    });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
