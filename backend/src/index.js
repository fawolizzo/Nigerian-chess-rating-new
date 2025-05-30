const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const playerRoutes = require('./routes/players');
const tournamentRoutes = require('./routes/tournaments');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5600;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);  // Fixed syntax error here
});
