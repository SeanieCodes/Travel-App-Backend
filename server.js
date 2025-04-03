const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const passport = require('passport');
const session = require('express-session');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure Passport
require('./config/passport')(passport);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000 // increase to 30 seconds
  })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));  

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const travelPlanRoutes = require('./routes/travelPlans');
const exportRoutes = require('./routes/export');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/travel-plans', travelPlanRoutes);
app.use('/api/export', exportRoutes);

// API Proxy route for handling external API requests
app.use('/api/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: 'URL parameter is required' });
    }
    
    console.log(`Proxy request for: ${url}`);
    
    const response = await fetch(url);
    
    // Check if the response is valid
    if (!response.ok) {
      console.error(`Proxy error: API responded with status ${response.status}`);
      return res.status(response.status).json({ 
        message: 'API request failed', 
        status: response.status 
      });
    }
    
    // Make sure we're getting JSON back before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Proxy error: Expected JSON but got ${contentType}`);
      const text = await response.text();
      console.error(`Response text preview: ${text.substring(0, 200)}...`);
      return res.status(500).json({ 
        message: 'API did not return JSON',
        contentType
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ message: 'Proxy error', error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to TravelApp API!');
});

// Define port
const PORT = process.env.PORT || 5001;

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});