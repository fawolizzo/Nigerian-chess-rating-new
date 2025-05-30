const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { supabaseAdmin } = require('./lib/supabase');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Logging

// Auth middleware for protected routes
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      message: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      throw new Error('Invalid token');
    }
    
    // Get user profile with role information
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }
    
    // Check if organizer is approved
    if (profile.role === 'ORGANIZER' && profile.status !== 'APPROVED') {
      return res.status(403).json({
        message: 'Your account is pending approval'
      });
    }
    
    // Add user info to request
    req.user = user;
    req.userRole = profile.role;
    req.userStatus = profile.status;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      message: 'Invalid or expired token'
    });
  }
};

// Authorization middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource'
      });
    }
    next();
  };
};

// Import routes
const playerRoutes = require('./routes/players');
const tournamentRoutes = require('./routes/tournaments');
const authRoutes = require('./routes/auth');
const ratingRoutes = require('./routes/ratings');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', authenticate, authorize(['OFFICER', 'ADMIN']), adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Not found handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// In your index.js file, add these lines:

// Import routes
const playerRoutes = require('./routes/players');
const tournamentRoutes = require('./routes/tournaments');

// Use routes
app.use('/api/players', playerRoutes);
app.use('/api/tournaments', tournamentRoutes);

module.exports = app;
