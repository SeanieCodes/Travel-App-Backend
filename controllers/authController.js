const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email || user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Login user with username/password
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return token and user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};

// Verify Google token and create/update user
exports.verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ message: 'Google token is required' });
    }
    
    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }
    
    const { 
      sub: googleId, 
      email, 
      name: displayName, 
      picture: profilePicture 
    } = payload;
    
    // Check if user exists
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Check if user exists with the same email
      user = await User.findOne({ email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.profilePicture = profilePicture;
        await user.save();
      } else {
        // Create new user
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
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Return token and user info
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
  } catch (error) {
    console.error('Google verification error:', error);
    res.status(500).json({ message: 'Error verifying Google token', error: error.message });
  }
};

// Get current user
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