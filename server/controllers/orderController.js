// server/controllers/orderController.js - COMPLETELY FIXED VERSION 2
const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const { 
  calculateDeliveryTime, 
  formatDeliveryMessage 
} = require('../utils/deliveryTimeCalculator');

// Process image upload
const processImageUpload = async (imageData, type) => {
  if (!imageData) return null;
  
  try {
    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image format:', imageData.substring(0, 50));
      throw new Error('Invalid image format. Must be base64 encoded image.');
    }
    
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024;
    
    console.log(`📊 Image size check: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);
    
    if (sizeInBytes > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }
    
    console.log(`☁️ Uploading ${type} to Cloudinary...`);
    const uploadResult = await uploadImage(imageData, `tailor-orders/${type}`);
    console.log(`✅ ${type} uploaded successfully:`, uploadResult.publicId);
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error(`❌ Error processing ${type} upload:`, error.message);
    throw error;
  }
};

// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log('📦 Create order request from user:', userId, 'role:', role);

    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Only customers can create orders' 
      });
    }

    const { 
      tailorId, 
      suitType,
      shalwarStyle,
      kameezStyle,
      measurements, 
      notes,
      dupattaDetails,
      referenceImage,
      customerSketch
    } = req.body;
    
    console.log('📋 Received order data:', {
      tailorId,
      suitType,
      shalwarStyle,
      kameezStyle,
      hasMeasurements: !!measurements,
      measurementKeys: measurements ? Object.keys(measurements) : [],
      hasDupattaDetails: !!dupattaDetails,
      hasReferenceImage: !!referenceImage,
      hasCustomerSketch: !!customerSketch
    });

    if (!measurements || typeof measurements !== 'object' || Object.keys(measurements).length === 0) {
      console.error('❌ Invalid or missing measurements:', measurements);
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Valid measurements object is required',
        received: measurements
      });
    }

    const requiredFields = ['chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength', 
                           'waist', 'hip', 'inseam', 'outseam', 'thigh'];
    const missingFields = requiredFields.filter(field => !measurements[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing measurement fields:', missingFields);
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: `Missing required measurements: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
    if (!tailor) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No tailor found with id ${tailorId}` 
      });
    }

    if (!['2-piece', '3-piece'].includes(suitType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Invalid suit type. Must be 2-piece or 3-piece'
      });
    }

    if (!shalwarStyle || !kameezStyle) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Both shalwar and kameez styles are required'
      });
    }

    if (suitType === '3-piece') {
      if (!dupattaDetails || !dupattaDetails.length || !dupattaDetails.width) {
        console.error('❌ Missing dupatta details for 3-piece suit:', dupattaDetails);
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Dupatta length and width are required for 3-piece suit',
          received: dupattaDetails
        });
      }
    }

    let referenceImageData = null;
    let customerSketchData = null;

    try {
      if (referenceImage) {
        console.log('📸 Processing reference image...');
        referenceImageData = await processImageUpload(referenceImage, 'reference');
      }
      
      if (customerSketch) {
        console.log('✏️ Processing customer sketch...');
        customerSketchData = await processImageUpload(customerSketch, 'sketch');
      }
    } catch (imageError) {
      console.error('❌ Image processing error:', imageError.message);
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: imageError.message || 'Failed to process images'
      });
    }

    console.log('💾 Creating order with measurements:', measurements);
    
    const orderData = {
      customer: userId,
      tailor: tailorId,
      suitType,
      shalwarStyle,
      kameezStyle,
      measurements: {
        chest: parseFloat(measurements.chest),
        shoulder: parseFloat(measurements.shoulder),
        sleeveLength: parseFloat(measurements.sleeveLength),
        neck: parseFloat(measurements.neck),
        kameezLength: parseFloat(measurements.kameezLength),
        waist: parseFloat(measurements.waist),
        hip: parseFloat(measurements.hip),
        inseam: parseFloat(measurements.inseam),
        outseam: parseFloat(measurements.outseam),
        thigh: parseFloat(measurements.thigh)
      },
      notes,
      status: 'pending',
      referenceImage: referenceImageData,
      customerSketch: customerSketchData
    };

    if (suitType === '3-piece') {
      orderData.dupattaDetails = {
        length: parseFloat(dupattaDetails.length),
        width: parseFloat(dupattaDetails.width),
        hasPeco: dupattaDetails.hasPeco || false
      };
      console.log('🧣 Adding dupatta details:', orderData.dupattaDetails);
    }

    const order = await Order.create(orderData);

    console.log('✅ Order created successfully:', order._id);

    const suitDescription = suitType === '3-piece' ? 
      `${suitType} suit (Shalwar, Kameez, Dupatta)` : 
      `${suitType} suit (Shalwar, Kameez)`;
    
    const messageContent = `📦 New order request for ${suitDescription}${referenceImageData || customerSketchData ? ' (includes design reference)' : ''}. Review and set a price to accept.`;
    
    await Message.create({
      sender: userId,
      receiver: tailorId,
      content: messageContent,
      order: order._id
    });

    await order.populate('customer tailor');

    res.status(StatusCodes.CREATED).json({ success: true, order });
  } catch (error) {
    console.error('❌ Create order error:', error.message);
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while creating order',
      error: error.message
    });
  }
};

// GET ORDER DETAILS
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`📦 Getting order ${id} for user ${userId} with role ${role}`);

    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: 'Order not found' 
      });
    }

    const isCustomer = role === 'customer' && order.customer._id.toString() === userId;
    const isTailor = role === 'tailor' && order.tailor._id.toString() === userId;

    if (!isCustomer && !isTailor) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to view this order' 
      });
    }

    console.log(`✅ Order found: ${order._id}, status: ${order.status}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Get order details error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while fetching order details',
      error: error.message 
    });
  }
};

// ✅ SIMPLIFIED & FIXED UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { id: orderId } = req.params;
    const { status, price } = req.body;

    console.log('\n🔄 STATUS UPDATE REQUEST');
    console.log('Order ID:', orderId);
    console.log('User ID:', userId);
    console.log('Role:', role);
    console.log('Requested Status:', status);
    console.log('Price:', price);

    // Validate
    if (!status) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Status is required' });
    }

    if (role !== 'tailor') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Only tailors can update order status' });
    }

    // Find order
    const order = await Order.findById(orderId).populate('customer tailor');
    
    if (!order) {
      console.error('❌ Order not found');
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Order not found' });
    }

    // Verify ownership
    if (order.tailor._id.toString() !== userId) {
      console.error('❌ Unauthorized - not order owner');
      return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Not authorized' });
    }

    console.log('Current Status:', order.status);
    console.log('Target Status:', status);

    // Validate transitions
    const validTransitions = {
      pending: ['accepted', 'rejected'],
      accepted: ['confirmed', 'rejected'],
      confirmed: ['making'],
      making: ['payment_done'],
      payment_done: ['completed']
    };

    const allowed = validTransitions[order.status];
    
    if (!allowed || !allowed.includes(status)) {
      console.error('❌ Invalid transition');
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Cannot change from ${order.status} to ${status}`,
        allowedStatuses: allowed
      });
    }

    // Handle acceptance
    let deliveryEstimate = null;
    if (status === 'accepted') {
      if (!price || price <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Price required' });
      }
      
      order.price = parseFloat(price);
      
      try {
        deliveryEstimate = await calculateDeliveryTime(userId, price);
        order.estimatedDeliveryDays = deliveryEstimate.estimatedDays;
        order.expectedCompletionDate = deliveryEstimate.completionDate;
        order.deliveryConfidence = deliveryEstimate.confidence;
      } catch (err) {
        console.error('⚠️ Delivery estimate error:', err.message);
      }
    }

    // Update status
    order.status = status;
    
    // Save
    await order.save();
    console.log('✅ Order saved with status:', order.status);

    // Notifications
    const messages = {
      accepted: `✅ Order accepted at PKR ${order.price}. Please review and confirm.`,
      rejected: '❌ Order rejected by tailor',
      making: '⚙️ Order is now in production',
      payment_done: '💰 Payment received',
      completed: '🎉 Order completed and ready for pickup!'
    };

    if (messages[status]) {
      try {
        await Message.create({
          sender: userId,
          receiver: order.customer._id,
          content: messages[status],
          order: order._id
        });
      } catch (err) {
        console.error('⚠️ Notification error:', err.message);
      }
    }

    // Delivery message
    if (status === 'accepted' && deliveryEstimate) {
      try {
        const deliveryMsg = formatDeliveryMessage(deliveryEstimate, `${order.suitType} suit`);
        await Message.create({
          sender: userId,
          receiver: order.customer._id,
          content: deliveryMsg,
          order: order._id
        });
      } catch (err) {
        console.error('⚠️ Delivery message error:', err.message);
      }
    }

    console.log('✅ STATUS UPDATE SUCCESS\n');
    
    res.status(StatusCodes.OK).json({ 
      success: true, 
      order,
      message: `Order ${status}`,
      deliveryEstimate: deliveryEstimate ? {
        days: deliveryEstimate.estimatedDays,
        date: deliveryEstimate.completionDate,
        confidence: deliveryEstimate.confidence
      } : null
    });

  } catch (error) {
    console.error('❌ STATUS UPDATE ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to update status',
      error: error.message
    });
  }
};

// CONFIRM ORDER
const confirmOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { id: orderId } = req.params;

    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Only customers can confirm' });
    }

    const order = await Order.findOne({ _id: orderId, customer: userId }).populate('customer tailor');
    
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Only accepted orders can be confirmed' });
    }

    order.status = 'confirmed';
    await order.save();

    await Message.create({
      sender: userId,
      receiver: order.tailor._id,
      content: '🎯 Order confirmed! Production can begin.',
      order: order._id
    });

    res.status(StatusCodes.OK).json({ success: true, order });
  } catch (error) {
    console.error('❌ Confirm error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to confirm',
      error: error.message 
    });
  }
};

// DELETE ORDER
const deleteOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Order not found' });
    }

    const isCustomer = role === 'customer' && order.customer.toString() === userId;
    const isTailor = role === 'tailor' && order.tailor.toString() === userId;

    if (!isCustomer && !isTailor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Not authorized' });
    }

    try {
      if (order.referenceImage?.publicId) await deleteImage(order.referenceImage.publicId);
      if (order.customerSketch?.publicId) await deleteImage(order.customerSketch.publicId);
    } catch (err) {
      console.error('⚠️ Image deletion error:', err.message);
    }

    await Order.findByIdAndDelete(orderId);
    await Message.deleteMany({ order: orderId });

    res.status(StatusCodes.OK).json({ success: true, msg: 'Order deleted' });
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to delete',
      error: error.message 
    });
  }
};

// REQUEST PRICE NEGOTIATION
const requestPriceNegotiation = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Only customers can negotiate' });
    }

    const order = await Order.findOne({ _id: orderId, customer: userId }).populate('customer tailor');

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Only for accepted orders' });
    }

    if (order.priceNegotiationRequested) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Already requested' });
    }

    if (order.priceChangedByTailor) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Price already changed' });
    }

    await order.requestPriceNegotiation();

    await Message.create({
      sender: userId,
      receiver: order.tailor._id,
      content: `💰 Customer wants to negotiate PKR ${order.price}`,
      order: order._id
    });

    res.status(StatusCodes.OK).json({ success: true, order });
  } catch (error) {
    console.error('❌ Negotiation error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to request negotiation',
      error: error.message 
    });
  }
};

// UPDATE ORDER PRICE
const updateOrderPrice = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { price } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    if (role !== 'tailor') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Only tailors can update price' });
    }

    if (!price || price <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Valid price required' });
    }

    const order = await Order.findOne({ _id: orderId, tailor: userId }).populate('customer tailor');

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ msg: 'Order not found' });
    }

    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Only for accepted orders' });
    }

    if (order.priceChangedByTailor) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Price already changed',
        alreadyChanged: true 
      });
    }

    await order.updatePrice(price, userId);

    await Message.create({
      sender: userId,
      receiver: order.customer._id,
      content: `✅ Price updated from PKR ${order.originalPrice} to PKR ${price}`,
      order: order._id
    });

    res.status(StatusCodes.OK).json({ 
      success: true, 
      order,
      originalPrice: order.originalPrice,
      newPrice: price 
    });
  } catch (error) {
    console.error('❌ Price update error:', error.message);
    
    if (error.message.includes('already been changed')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: error.message,
        alreadyChanged: true
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to update price',
      error: error.message 
    });
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  updateOrderStatus,
  confirmOrder,
  deleteOrder, 
  requestPriceNegotiation,
  updateOrderPrice    
};