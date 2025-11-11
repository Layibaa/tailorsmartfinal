// server/utils/deliveryTimeCalculator.js
const Order = require('../models/Order');

/**
 * Calculate estimated delivery time based on tailor's current workload
 * @param {String} tailorId - The tailor's ID
 * @param {Number} newOrderPrice - Price of the new order
 * @returns {Object} - { estimatedDays, completionDate }
 */
const calculateDeliveryTime = async (tailorId, newOrderPrice) => {
  try {
    // Get all active orders for this tailor (confirmed, making)
    const activeOrders = await Order.find({
      tailor: tailorId,
      status: { $in: ['confirmed', 'making'] }
    }).select('price status createdAt');

    // Base parameters for calculation
    const BASE_DAYS_PER_ORDER = 3; // Base days to complete one order
    const PRICE_WEIGHT = 0.002; // Impact of price on days (higher price = more time)
    const MIN_DELIVERY_DAYS = 2; // Minimum delivery time
    const MAX_DELIVERY_DAYS = 30; // Maximum delivery time

    // Calculate workload based on existing orders
    let totalWorkloadDays = 0;

    for (const order of activeOrders) {
      // Calculate days for each order based on price
      const orderDays = BASE_DAYS_PER_ORDER + (order.price * PRICE_WEIGHT);
      
      // Orders in 'making' status are partially done (assume 50% complete)
      if (order.status === 'making') {
        totalWorkloadDays += orderDays * 0.5;
      } else {
        totalWorkloadDays += orderDays;
      }
    }

    // Calculate days for the new order
    const newOrderDays = BASE_DAYS_PER_ORDER + (newOrderPrice * PRICE_WEIGHT);

    // Total estimated days = existing workload + new order
    let estimatedDays = Math.ceil(totalWorkloadDays + newOrderDays);

    // Apply min/max constraints
    estimatedDays = Math.max(MIN_DELIVERY_DAYS, Math.min(MAX_DELIVERY_DAYS, estimatedDays));

    // Calculate completion date
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDays);

    // Calculate a confidence level based on workload
    const workloadFactor = activeOrders.length;
    let confidence = 'high';
    if (workloadFactor > 5) {
      confidence = 'medium';
    }
    if (workloadFactor > 10) {
      confidence = 'low';
    }

    return {
      estimatedDays,
      completionDate,
      confidence,
      currentWorkload: activeOrders.length,
      workloadDetails: {
        activeOrders: activeOrders.length,
        totalWorkloadDays: Math.ceil(totalWorkloadDays),
        newOrderDays: Math.ceil(newOrderDays)
      }
    };
  } catch (error) {
    console.error('Error calculating delivery time:', error);
    
    // Fallback to default estimate
    const fallbackDays = 7;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + fallbackDays);
    
    return {
      estimatedDays: fallbackDays,
      completionDate,
      confidence: 'low',
      currentWorkload: 0,
      workloadDetails: null,
      error: 'Could not calculate precise estimate'
    };
  }
};

/**
 * Format delivery message for customer
 * @param {Object} deliveryEstimate - Result from calculateDeliveryTime
 * @param {String} garmentType - Type of garment
 * @returns {String} - Formatted message
 */
const formatDeliveryMessage = (deliveryEstimate, garmentType) => {
  const { estimatedDays, completionDate, confidence, currentWorkload } = deliveryEstimate;
  
  const formattedDate = completionDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `Estimated Delivery Time\n\n`;
  message += `Your ${garmentType} order will be ready in approximately ${estimatedDays} days.\n\n`;
  message += `Expected completion: ${formattedDate}\n\n`;

  if (currentWorkload > 0) {
    message += `Current workload: ${currentWorkload} active order${currentWorkload > 1 ? 's' : ''}\n\n`;
  }

  // Add confidence-based message
  if (confidence === 'high') {
    message += `This is a reliable estimate based on current capacity.`;
  } else if (confidence === 'medium') {
    message += `⚠️ Please note: We have moderate workload. The timeline may vary slightly.`;
  } else {
    message += `⚠️ Please note: We have high workload. We'll update you if there are any changes.`;
  }

  return message;
};

/**
 * Update delivery estimate when order status changes
 * @param {String} orderId - The order ID
 * @returns {Object} - Updated delivery estimate
 */
const updateDeliveryEstimate = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('tailor');
    
    if (!order || !order.expectedCompletionDate) {
      return null;
    }

    // Recalculate based on current status
    if (order.status === 'making') {
      // If already in making, estimate 50% time remaining
      const originalEstimate = order.expectedCompletionDate;
      const now = new Date();
      const remainingTime = originalEstimate - now;
      const adjustedTime = remainingTime * 0.7; // 70% of remaining time
      
      const newCompletionDate = new Date(now.getTime() + adjustedTime);
      
      return {
        estimatedDays: Math.ceil(adjustedTime / (1000 * 60 * 60 * 24)),
        completionDate: newCompletionDate,
        status: 'in_progress'
      };
    }

    return null;
  } catch (error) {
    console.error('Error updating delivery estimate:', error);
    return null;
  }
};

module.exports = {
  calculateDeliveryTime,
  formatDeliveryMessage,
  updateDeliveryEstimate
};