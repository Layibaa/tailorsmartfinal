// server/routes/deliveryRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireTailor } = require('../middleware/auth');
const { 
  predictDeliveryTime, 
  getTailorDeliveryStats 
} = require('../services/deliveryPredictionService');
const { StatusCodes } = require('http-status-codes');

// Get delivery prediction for a potential order (before creating)
router.post('/predict', auth, async (req, res) => {
  try {
    const { tailorId, garmentType, measurements, referenceImage, customerSketch } = req.body;
    
    if (!tailorId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Tailor ID is required'
      });
    }
    
    const prediction = await predictDeliveryTime({
      garmentType,
      measurements,
      referenceImage,
      customerSketch
    }, tailorId);
    
    const estimatedDays = Math.round(
      (prediction.estimatedCompletionDate - new Date()) / (1000 * 60 * 60 * 24)
    );
    
    res.json({
      success: true,
      prediction: {
        estimatedDate: prediction.estimatedCompletionDate,
        estimatedDays,
        confidence: prediction.predictionConfidence,
        complexityScore: prediction.complexityScore,
        factors: prediction.predictionFactors
      }
    });
  } catch (error) {
    console.error('Delivery prediction error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error calculating delivery prediction',
      error: error.message
    });
  }
});

// Get tailor's delivery performance statistics
router.get('/tailor-stats/:tailorId', auth, async (req, res) => {
  try {
    const { tailorId } = req.params;
    
    const stats = await getTailorDeliveryStats(tailorId);
    
    if (!stats) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor statistics not found'
      });
    }
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get tailor stats error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error fetching tailor statistics',
      error: error.message
    });
  }
});

// Get own delivery statistics (for tailors)
router.get('/my-stats', auth, requireTailor, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const stats = await getTailorDeliveryStats(userId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get my stats error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error fetching your statistics',
      error: error.message
    });
  }
});

module.exports = router;