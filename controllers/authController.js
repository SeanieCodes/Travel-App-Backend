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
      
      console.log('Received credential:', credential ? 'Present' : 'Missing');
      
      if (!credential) {
        return res.status(400).json({ message: 'Google token is required' });
      }
      
      try {
        // Add more detailed logging around token verification
        const ticket = await oauth2Client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        
        console.log('Ticket payload:', ticket.getPayload());
        
        const payload = ticket.getPayload();
        
        if (!payload) {
          console.error('No payload found in ticket');
          return res.status(400).json({ message: 'Invalid Google token' });
        }
        
        const { 
          sub: googleId, 
          email, 
          name: displayName, 
          picture: profilePicture 
        } = payload;
        
        console.log('Extracted payload details:', { 
          googleId, 
          email, 
          displayName 
        });
        
        // Rest of your existing code...
        
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