// ====================
// server/middleware/auditLog.js
// ====================
const Logger = require('../utils/logger');

// Middleware to log admin actions
const auditLog = (action) => {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to log after successful response
    res.json = function(data) {
      // Log the admin action
      if (req.admin && res.statusCode < 400) {
        Logger.adminAction(req.admin.id, action, {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = auditLog;
