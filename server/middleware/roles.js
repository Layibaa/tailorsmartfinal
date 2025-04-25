// Role based access control middleware

/**
 * Restrict routes to specific roles
 * @param {...String} roles - Roles that are allowed to access the route
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
      // Check if user exists and has a role
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this route'
        });
      }
  
      // Check if user's role is included in allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `User role '${req.user.role}' is not authorized to access this route`
        });
      }
  
      // User has permission, proceed to next middleware
      next();
    };
  };
  
  // Specific role middleware for common use cases
  exports.isCustomer = (req, res, next) => {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can access this route'
      });
    }
    next();
  };
  
  exports.isTailor = (req, res, next) => {
    if (req.user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only tailors can access this route'
      });
    }
    next();
  };
  
  exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this route'
      });
    }
    next();
  };
  
  exports.isCustomerOrTailor = (req, res, next) => {
    if (req.user.role !== 'customer' && req.user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only customers or tailors can access this route'
      });
    }
    next();
  };
  
  exports.isAdminOrTailor = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only admins or tailors can access this route'
      });
    }
    next();
  };
  