// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
  
    // Log error for server debugging
    console.error(err);
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: message.join(', ')
      });
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const message = `Duplicate value entered for ${field} field`;
      return res.status(400).json({
        success: false,
        message
      });
    }
  
    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      const message = `Resource not found with id of ${err.value}`;
      return res.status(404).json({
        success: false,
        message
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
  
    // Default error response
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  };
  
  module.exports = errorHandler;