// ====================
// server/middleware/adminAuth.js (Enhanced version)
// ====================
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const Admin = require('../models/Admin');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.id).select('-password -refreshTokens');
    
    if (!admin || !admin.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. Admin not found or inactive.',
        code: 'ADMIN_NOT_FOUND'
      });
    }
    
    req.admin = {
      id: admin._id,
      role: admin.role,
      permissions: admin.permissions,
      name: admin.name,
      email: admin.email
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. Token expired.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.error('Admin auth error:', error);
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Access denied. Authentication failed.',
      code: 'AUTH_ERROR'
    });
  }
};

// Permission check middleware
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.permissions || !req.admin.permissions.includes(requiredPermission)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required permission: ${requiredPermission}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required: requiredPermission,
        current: req.admin?.permissions || []
      });
    }
    next();
  };
};

// Multiple permissions check
const checkAnyPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    const hasPermission = permissions.some(permission => 
      req.admin.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Access denied. Required one of: ${permissions.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions,
        current: req.admin.permissions
      });
    }
    next();
  };
};

// Role check middleware
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(req.admin.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Access denied. Insufficient role permissions.',
        code: 'INSUFFICIENT_ROLE',
        required: roles,
        current: req.admin.role
      });
    }
    next();
  };
};

// Super admin only middleware
const superAdminOnly = (req, res, next) => {
  if (req.admin.role !== 'superadmin') {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Access denied. Super admin access required.',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
};

module.exports = {
  adminAuth,
  checkPermission,
  checkAnyPermission,
  checkRole,
  superAdminOnly
};
