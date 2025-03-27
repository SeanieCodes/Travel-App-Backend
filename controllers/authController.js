const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Create new user
    const user = new User({
      username,
      password
    });
    
    // Save user to database
    await user.save();
    
    // Return success message
    res.status(201).json({ 
      message: 'User registered successfully',
      username: user.username,
      _id: user._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Return token and user info
    res.json({
      message: 'Login successful',
      token,
      username: user.username,
      _id: user._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};