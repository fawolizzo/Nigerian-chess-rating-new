const { supabaseAdmin } = require('../lib/supabase');

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error',
      message: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the token with Supabase
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
    
    // Add user info to request
    req.user = user;
    req.userRole = profile.role;
    req.userStatus = profile.status;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ 
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

// Authorization middleware
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole || !allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access this resource'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
