// server/middleware/auth.js - Enhanced with role checking
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

// Base authentication middleware
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      success: false, 
      msg: 'Authentication invalid' 
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user and check if still active
    const user = await User.findById(payload.id).select('name email role status');
    if (!user || user.status !== 'active') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: 'User account is inactive'
      });
    }
    
    req.user = { 
      userId: payload.id, 
      id: payload.id, // For backward compatibility
      role: payload.role,
      userObj: user
    };
    
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ 
      success: false, 
      msg: 'Authentication invalid' 
    });
  }
};

// Role-based access control
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Specific role middlewares for convenience
const requireSuperAdmin = requireRole('superadmin');
const requireAdmin = requireRole('superadmin', 'admin');
const requireSupport = requireRole('superadmin', 'admin', 'support');
const requireTailor = requireRole('tailor');
const requireCustomer = requireRole('customer');

module.exports = {
  auth,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireSupport,
  requireTailor,
  requireCustomer
};