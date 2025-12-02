// server/controllers/orderController.js - REMOVED PRICE NEGOTIATION
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
      console.error(' Invalid image format:', imageData.substring(0, 50));
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
    console.log(` ${type} uploaded successfully:`, uploadResult.publicId);
    
    return {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error(` Error processing ${type} upload:`, error.message);
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
      console.error(' Invalid or missing measurements:', measurements);
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Valid measurements object is required',
        received: measurements
      });
    }

    const requiredFields = ['chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength', 
                           'waist', 'hip', 'inseam', 'outseam', 'thigh'];
    const missingFields = requiredFields.filter(field => !measurements[field]);
    
    if (missingFields.length > 0) {
      console.error(' Missing measurement fields:', missingFields);
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
        console.error(' Missing dupatta details for 3-piece suit:', dupattaDetails);
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
      console.error(' Image processing error:', imageError.message);
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

    console.log(' Order created successfully:', order._id);

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
    console.error(' Create order error:', error.message);
    
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

    console.log(` Order found: ${order._id}, status: ${order.status}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error(' Get order details error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while fetching order details',
      error: error.message 
    });
  }
};

// UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    console.log('\n🔵 ========================================');
    console.log('🔵 UPDATE ORDER STATUS REQUEST RECEIVED');
    console.log('🔵 ========================================');
    
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { id: orderId } = req.params;
    const { status, price } = req.body;

    console.log('👤 User ID:', userId);
    console.log('🎭 User Role:', role);
    console.log('📦 Order ID:', orderId);
    console.log('📊 Requested Status:', status);
    console.log('💰 Price:', price);

    // VALIDATION: Check if status is provided
    if (!status) {
      console.error(' Status is missing from request body');
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Status is required in request body',
        received: req.body
      });
    }

    // VALIDATION: Only tailors can update status
    if (role !== 'tailor') {
      console.error(' User is not a tailor. Role:', role);
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Only tailors can update order status',
        currentRole: role
      });
    }

    console.log('🔍 Finding order in database...');
    
    // FIND ORDER
    const order = await Order.findById(orderId).populate('customer tailor');
    
    if (!order) {
      console.error(' Order not found in database');
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: 'Order not found',
        orderId: orderId
      });
    }

    console.log(' Order found!');
    console.log('📋 Current Order Status:', order.status);

    // VERIFY OWNERSHIP
    const orderTailorId = order.tailor._id.toString();
    const requestUserId = userId.toString();
    
    if (orderTailorId !== requestUserId) {
      console.error(' Unauthorized - User is not the order tailor');
      console.error('   Order Tailor ID:', orderTailorId);
      console.error('   Request User ID:', requestUserId);
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to update this order'
      });
    }

    console.log(' Ownership verified!');

    // VALIDATE STATUS TRANSITIONS
    const validTransitions = {
      pending: ['accepted', 'rejected'],
      accepted: ['confirmed', 'rejected'],
      confirmed: ['making'],
      making: ['payment_done'],
      payment_done: ['completed']
    };

    const allowedStatuses = validTransitions[order.status];
    
    if (!allowedStatuses) {
      console.error(' No valid transitions from current status');
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Order status ${order.status} cannot be changed`,
        currentStatus: order.status
      });
    }
    
    if (!allowedStatuses.includes(status)) {
      console.error(' Invalid status transition requested');
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Cannot change from ${order.status} to ${status}`,
        currentStatus: order.status,
        requestedStatus: status,
        allowedStatuses: allowedStatuses
      });
    }

    console.log(' Status transition is valid!');
    console.log(`   From: ${order.status} → To: ${status}`);

    // HANDLE REJECTION
    if (status === 'rejected') {
      console.log('🚫 Processing rejection...');
      
      order.status = 'rejected';
      await order.save();

      // Send notification
      try {
        await Message.create({
          sender: userId,
          receiver: order.customer._id,
          content: ' Your order request has been rejected by the tailor',
          order: order._id
        });
        console.log(' Rejection notification sent');
      } catch (err) {
        console.error('⚠️ Notification error:', err.message);
      }

      console.log(' Order rejected successfully');
      
      return res.status(StatusCodes.OK).json({ 
        success: true, 
        order,
        message: 'Order rejected successfully'
      });
    }

    // HANDLE ACCEPTANCE - Requires price
    let deliveryEstimate = null;
    if (status === 'accepted') {
      console.log(' Processing acceptance...');
      
      if (!price || price <= 0) {
        console.error(' Price is missing or invalid for acceptance');
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          msg: 'Valid price is required to accept order',
          receivedPrice: price
        });
      }
      
      console.log('💰 Setting price:', price);
      order.price = parseFloat(price);
      
      // Calculate delivery estimate
      try {
        console.log('📅 Calculating delivery estimate...');
        deliveryEstimate = await calculateDeliveryTime(userId, price);
        order.estimatedDeliveryDays = deliveryEstimate.estimatedDays;
        order.expectedCompletionDate = deliveryEstimate.completionDate;
        order.deliveryConfidence = deliveryEstimate.confidence;
        console.log(' Delivery estimate calculated:', deliveryEstimate);
      } catch (err) {
        console.error('⚠️ Delivery estimate error:', err.message);
      }
    }

    // UPDATE STATUS
    console.log(`🔄 Updating status from ${order.status} to ${status}`);
    order.status = status;
    
    // SAVE ORDER
    console.log('💾 Saving order...');
    await order.save();
    console.log(' Order saved successfully');

    // SEND NOTIFICATIONS
    const notificationMessages = {
      accepted: ` Order accepted at PKR ${order.price}. Please review and confirm.`,
      making: '⚙️ Your order is now in production',
      payment_done: '💰 Payment confirmed. Order will be completed soon.',
      completed: '🎉 Order completed and ready for pickup!'
    };

    if (notificationMessages[status]) {
      try {
        console.log('📨 Sending notification to customer...');
        await Message.create({
          sender: userId,
          receiver: order.customer._id,
          content: notificationMessages[status],
          order: order._id
        });
        console.log(' Notification sent');
      } catch (err) {
        console.error('⚠️ Notification error:', err.message);
      }
    }

    // SEND DELIVERY MESSAGE (for acceptance)
    if (status === 'accepted' && deliveryEstimate) {
      try {
        const deliveryMsg = formatDeliveryMessage(deliveryEstimate, `${order.suitType} suit`);
        await Message.create({
          sender: userId,
          receiver: order.customer._id,
          content: deliveryMsg,
          order: order._id
        });
        console.log(' Delivery estimate message sent');
      } catch (err) {
        console.error('⚠️ Delivery message error:', err.message);
      }
    }

    console.log('\n ========================================');
    console.log(' STATUS UPDATE COMPLETED SUCCESSFULLY');
    console.log(' New Status:', order.status);
    console.log(' ========================================\n');
    
    // RETURN RESPONSE
    return res.status(StatusCodes.OK).json({ 
      success: true, 
      order,
      message: `Order status updated to ${status}`,
      deliveryEstimate: deliveryEstimate ? {
        days: deliveryEstimate.estimatedDays,
        date: deliveryEstimate.completionDate,
        confidence: deliveryEstimate.confidence
      } : null
    });

  } catch (error) {
    console.error('\n ========================================');
    console.error(' STATUS UPDATE ERROR');
    console.error(' Error Message:', error.message);
    console.error(' Stack Trace:', error.stack);
    console.error(' ========================================\n');
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to update order status',
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
    console.error(' Confirm error:', error.message);
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
    console.error(' Delete error:', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Failed to delete',
      error: error.message 
    });
  }
};

module.exports = {
  createOrder,
  getOrderDetails,
  updateOrderStatus,
  confirmOrder,
  deleteOrder
};