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