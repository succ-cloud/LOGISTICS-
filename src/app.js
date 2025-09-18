const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv'); // Import dotenv

// Load environment variables
dotenv.config({ path: './.env' }); // Specify path to .env file

const trackingRoutes = require('./routes/trackingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const settingsRoutes = require('./routes/settingsRoutes'); // Import settings routes

const app = express();

// Middleware
app.use(express.json());

// Fix CORS configuration
app.use(cors({
   origin: ['http://127.0.0.1:5500', 'http://localhost:5500',
    // 'https://logistics-pn8s.onrender.com',
    'https://globallogistics.netlify.app/',
    'https://globaladmin.netlify.app/'
  ], // Allow both common local development URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Add OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests for all routes
app.options('*', cors()); // Enable preflight across the board

app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes); // Mount auth routes
app.use('/api/tracking', trackingRoutes); // Keep tracking routes
app.use('/api/settings', settingsRoutes); // Add settings routes

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Global Track API'
  });
});

// Root API route for connection testing
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global Error Handler (Optional but recommended)
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Something went wrong!'
  });
});

module.exports = app;
