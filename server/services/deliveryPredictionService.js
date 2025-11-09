// server/services/deliveryPredictionService.js
const Order = require('../models/Order');
const User = require('../models/User');

/**
 * Calculate complexity score based on order details
 */
const calculateComplexityScore = (orderData) => {
  let complexity = 5; // Base complexity
  
  // Garment type complexity
  const garmentComplexity = {
    'shalwar': 3,
    'kameez': 4
  };
  complexity += garmentComplexity[orderData.garmentType] || 3;
  
  // Style complexity
  const styleComplexity = {
    'simple': 0,
    'patiala': 2,
    'gharara': 3,
    'capri': 1,
    'anarkali': 3,
    'angrakka': 2,
    'a-line': 2,
    'other': 2
  };
  
  if (orderData.shalwarStyle) {
    complexity += styleComplexity[orderData.shalwarStyle] || 1;
  }
  if (orderData.kameezStyle) {
    complexity += styleComplexity[orderData.kameezStyle] || 1;
  }
  
  // Reference image/sketch adds complexity
  if (orderData.referenceImage || orderData.customerSketch) {
    complexity += 1;
  }
  
  // Normalize to 1-10 scale
  return Math.min(10, Math.max(1, complexity));
};

/**
 * Get tailor's current workload
 */
const getTailorWorkload = async (tailorId) => {
  const activeStatuses = ['accepted', 'confirmed', 'making', 'payment_done'];
  
  const activeOrders = await Order.countDocuments({
    tailor: tailorId,
    status: { $in: activeStatuses }
  });
  
  return activeOrders;
};

/**
 * Calculate tailor's average completion time
 */
const getTailorAvgCompletionTime = async (tailorId) => {
  const completedOrders = await Order.find({
    tailor: tailorId,
    status: 'completed',
    actualCompletionDate: { $exists: true }
  }).limit(20).sort({ createdAt: -1 });
  
  if (completedOrders.length === 0) {
    return 7; // Default 7 days for new tailors
  }
  
  const totalDays = completedOrders.reduce((sum, order) => {
    const startDate = order.timeline.find(t => t.status === 'confirmed')?.date || order.createdAt;
    const endDate = order.actualCompletionDate;
    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);
  
  return totalDays / completedOrders.length;
};

/**
 * Calculate tailor's historical prediction accuracy
 */
const getTailorPredictionAccuracy = async (tailorId) => {
  const ordersWithPredictions = await Order.find({
    tailor: tailorId,
    predictionAccuracy: { $exists: true, $ne: null }
  }).limit(10).sort({ createdAt: -1 });
  
  if (ordersWithPredictions.length === 0) {
    return 75; // Default 75% accuracy
  }
  
  const avgAccuracy = ordersWithPredictions.reduce((sum, order) => 
    sum + order.predictionAccuracy, 0
  ) / ordersWithPredictions.length;
  
  return avgAccuracy;
};

/**
 * Main function to predict delivery time
 */
const predictDeliveryTime = async (orderData, tailorId) => {
  try {
    // 1. Calculate complexity score
    const complexityScore = calculateComplexityScore(orderData);
    
    // 2. Get tailor's current workload
    const workload = await getTailorWorkload(tailorId);
    
    // 3. Get tailor's average completion time
    const avgCompletionTime = await getTailorAvgCompletionTime(tailorId);
    
    // 4. Get tailor's historical accuracy
    const historicalAccuracy = await getTailorPredictionAccuracy(tailorId);
    
    // 5. Calculate base time (in days)
    let baseDays = avgCompletionTime;
    
    // 6. Apply complexity adjustment
    const complexityAdjustment = (complexityScore - 5) * 0.3; // ±30% per complexity point
    baseDays *= (1 + complexityAdjustment);
    
    // 7. Apply workload adjustment
    const workloadAdjustment = workload * 0.5; // Add 0.5 day per active order
    baseDays += workloadAdjustment;
    
    // 8. Apply minimum and maximum constraints
    baseDays = Math.max(3, Math.min(30, baseDays)); // Between 3 and 30 days
    
    // 9. Calculate confidence level
    let confidence = 'medium';
    if (historicalAccuracy > 85 && workload < 5) {
      confidence = 'high';
    } else if (historicalAccuracy < 70 || workload > 10) {
      confidence = 'low';
    }
    
    // 10. Calculate estimated completion date
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + Math.round(baseDays));
    
    // 11. Return prediction data
    return {
      estimatedCompletionDate: estimatedDate,
      predictionConfidence: confidence,
      complexityScore,
      predictionFactors: {
        tailorWorkload: workload,
        avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
        complexityAdjustment: Math.round(complexityAdjustment * 100) / 100,
        historicalAccuracy: Math.round(historicalAccuracy)
      },
      estimatedDays: Math.round(baseDays)
    };
  } catch (error) {
    console.error('Error predicting delivery time:', error);
    
    // Fallback prediction
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 7);
    
    return {
      estimatedCompletionDate: fallbackDate,
      predictionConfidence: 'low',
      complexityScore: 5,
      predictionFactors: {
        tailorWorkload: 0,
        avgCompletionTime: 7,
        complexityAdjustment: 0,
        historicalAccuracy: 75
      },
      estimatedDays: 7
    };
  }
};

/**
 * Update prediction when order status changes
 */
const updatePrediction = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;
    
    // Only update prediction for active orders
    if (!['confirmed', 'making'].includes(order.status)) {
      return null;
    }
    
    const prediction = await predictDeliveryTime(order, order.tailor);
    
    order.estimatedCompletionDate = prediction.estimatedCompletionDate;
    order.predictionConfidence = prediction.predictionConfidence;
    order.complexityScore = prediction.complexityScore;
    order.predictionFactors = prediction.predictionFactors;
    
    await order.save();
    
    return prediction;
  } catch (error) {
    console.error('Error updating prediction:', error);
    return null;
  }
};

/**
 * Get tailor's delivery performance statistics
 */
const getTailorDeliveryStats = async (tailorId) => {
  try {
    const completedOrders = await Order.find({
      tailor: tailorId,
      status: 'completed',
      actualCompletionDate: { $exists: true },
      estimatedCompletionDate: { $exists: true }
    });
    
    if (completedOrders.length === 0) {
      return {
        totalOrders: 0,
        avgAccuracy: 0,
        onTimeDeliveries: 0,
        avgCompletionTime: 0
      };
    }
    
    let onTimeCount = 0;
    let totalAccuracy = 0;
    let totalCompletionTime = 0;
    
    completedOrders.forEach(order => {
      // Check if delivered on time (within 1 day of estimate)
      const diff = Math.abs(
        order.actualCompletionDate.getTime() - 
        order.estimatedCompletionDate.getTime()
      ) / (1000 * 60 * 60 * 24);
      
      if (diff <= 1) onTimeCount++;
      
      if (order.predictionAccuracy) {
        totalAccuracy += order.predictionAccuracy;
      }
      
      // Calculate actual completion time
      const startDate = order.timeline.find(t => t.status === 'confirmed')?.date || order.createdAt;
      const days = (order.actualCompletionDate - startDate) / (1000 * 60 * 60 * 24);
      totalCompletionTime += days;
    });
    
    return {
      totalOrders: completedOrders.length,
      avgAccuracy: Math.round(totalAccuracy / completedOrders.length),
      onTimePercentage: Math.round((onTimeCount / completedOrders.length) * 100),
      avgCompletionTime: Math.round((totalCompletionTime / completedOrders.length) * 10) / 10
    };
  } catch (error) {
    console.error('Error getting tailor delivery stats:', error);
    return null;
  }
};

module.exports = {
  predictDeliveryTime,
  updatePrediction,
  getTailorDeliveryStats,
  calculateComplexityScore,
  getTailorWorkload
};