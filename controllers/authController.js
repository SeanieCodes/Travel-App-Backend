const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create OAuth2 client with your Google Client ID
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT token function
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email || user.username },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

exports.verifyGoogleToken = async (req, res) => {
  try {
    const { credential } = req.body;
    
    console.log('-------------------------');
    console.log('Google Token Verification Attempt');
    console.log('Credential present:', !!credential);
    console.log('Credential length:', credential ? credential.length : 'N/A');
    console.log('Client ID used:', process.env.GOOGLE_CLIENT_ID);
    
    if (!credential) {
      console.error('No credential provided');
      return res.status(400).json({ message: 'Google token is required' });
    }

    try {
      // Verify the token
      const ticket = await oauth2Client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      
      // Log ticket details
      const payload = ticket.getPayload();
      console.log('Payload extracted:', {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub
      });

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

      // Find or create user
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

    } catch (verificationError) {
      // Detailed error logging
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
    // Comprehensive error logging
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