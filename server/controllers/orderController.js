// server/controllers/orderController.js - UPDATED with price negotiation
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

// ✅ Process image upload
const processImageUpload = async (imageData, type) => {
  if (!imageData) return null;
  
  try {
    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image format:', imageData.substring(0, 50));
      throw new Error('Invalid image format. Must be base64 encoded image.');
    }
    
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
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

// ✅ CREATE ORDER - UPDATED FOR SUIT SYSTEM
// server/controllers/orderController.js - ENHANCED createOrder
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
    
    // ✅ EXTENSIVE LOGGING
    console.log('📋 Received order data:', {
      tailorId,
      suitType,
      shalwarStyle,
      kameezStyle,
      hasMeasurements: !!measurements,
      measurementKeys: measurements ? Object.keys(measurements) : [],
      measurementValues: measurements,
      hasDupattaDetails: !!dupattaDetails,
      dupattaValues: dupattaDetails,
      hasReferenceImage: !!referenceImage,
      hasCustomerSketch: !!customerSketch
    });

    // ✅ VALIDATE MEASUREMENTS OBJECT
    if (!measurements || typeof measurements !== 'object' || Object.keys(measurements).length === 0) {
      console.error('❌ Invalid or missing measurements:', measurements);
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Valid measurements object is required',
        received: measurements
      });
    }

    // Validate required measurement fields
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

    // Validate tailor
    const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
    if (!tailor) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No tailor found with id ${tailorId}` 
      });
    }

    // Validate suit type
    if (!['2-piece', '3-piece'].includes(suitType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Invalid suit type. Must be 2-piece or 3-piece'
      });
    }

    // Validate styles
    if (!shalwarStyle || !kameezStyle) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Both shalwar and kameez styles are required'
      });
    }

    // ✅ VALIDATE DUPATTA FOR 3-PIECE
    if (suitType === '3-piece') {
      if (!dupattaDetails || !dupattaDetails.length || !dupattaDetails.width) {
        console.error('❌ Missing dupatta details for 3-piece suit:', dupattaDetails);
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: 'Dupatta length and width are required for 3-piece suit',
          received: dupattaDetails
        });
      }
    }

    // Process image uploads
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

    // ✅ BUILD ORDER DATA WITH EXPLICIT STRUCTURE
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
      isLocked: false,
      referenceImage: referenceImageData,
      customerSketch: customerSketchData
    };

    // Add dupatta details for 3-piece
    if (suitType === '3-piece') {
      orderData.dupattaDetails = {
        length: parseFloat(dupattaDetails.length),
        width: parseFloat(dupattaDetails.width),
        hasPeco: dupattaDetails.hasPeco || false
      };
      console.log('🧣 Adding dupatta details:', orderData.dupattaDetails);
    }

    console.log('📦 Final order data structure:', {
      ...orderData,
      referenceImage: orderData.referenceImage ? '[PRESENT]' : null,
      customerSketch: orderData.customerSketch ? '[PRESENT]' : null
    });

    // ✅ CREATE ORDER
    const order = await Order.create(orderData);

    console.log('✅ Order created successfully:', {
      id: order._id,
      hasMeasurements: !!order.measurements,
      measurementKeys: order.measurements ? Object.keys(order.measurements.toObject()) : [],
      hasDupatta: !!order.dupattaDetails
    });

    // Create notification message
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

    console.log('📧 Notification sent to tailor');

    // Populate order data for response
    await order.populate('customer tailor');

    res.status(StatusCodes.CREATED).json({ success: true, order });
  } catch (error) {
    console.error('❌ Create order error:', {
      message: error.message,
      stack: error.stack,
      validationErrors: error.errors
    });
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while creating order',
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors) : []
    });
  }
};

// ✅ GET ORDER DETAILS
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

    // Check authorization
    const isCustomer = role === 'customer' && order.customer._id.toString() === userId;
    const isTailor = role === 'tailor' && order.tailor._id.toString() === userId;

    if (!isCustomer && !isTailor) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to view this order' 
      });
    }

    console.log(`✅ Order found: ${order._id}, status: ${order.status}, isLocked: ${order.isLocked}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('❌ Get order details error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while fetching order details',
      error: error.message 
    });
  }
};

// ✅ LOCK/UNLOCK ORDER
const lockOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`🔐 Lock request - Order: ${id}, User: ${userId}, Role: ${role}, isLocked: ${isLocked}`);

    if (typeof isLocked !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'isLocked must be a boolean value',
        received: typeof isLocked,
        value: isLocked
      });
    }

    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: 'Order not found' 
      });
    }

    console.log(`📦 Order found - Customer: ${order.customer._id}, Tailor: ${order.tailor._id}, Current lock: ${order.isLocked}, Status: ${order.status}`);

    if (role !== 'customer') {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Only customers can lock/unlock orders' 
      });
    }

    if (order.customer._id.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to lock/unlock this order' 
      });
    }

    if (!['accepted', 'confirmed'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Order cannot be locked/unlocked in current status (${order.status}). Only accepted or confirmed orders can be locked.` 
      });
    }

    order.isLocked = isLocked;
    order.updatedAt = new Date();
    const savedOrder = await order.save();

    console.log(`✅ Order lock updated successfully: ${savedOrder.isLocked}`);

    if (order.tailor) {
      try {
        await Message.create({
          sender: userId,
          receiver: order.tailor._id,
          content: isLocked 
            ? `🔒 Customer has locked the design. All details are finalized. You can proceed with production.`
            : `🔓 Customer has unlocked the design. Changes can now be made.`,
          order: order._id
        });
        console.log('📧 Lock notification sent to tailor');
      } catch (msgError) {
        console.error('❌ Failed to send lock notification:', msgError);
      }
    }

    await savedOrder.populate('customer tailor');

    res.json({
      success: true,
      msg: `Order ${isLocked ? 'locked' : 'unlocked'} successfully`,
      order: savedOrder,
      isLocked: savedOrder.isLocked
    });
  } catch (error) {
    console.error('❌ Lock order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating lock status',
      error: error.message 
    });
  }
};  

// ✅ UPDATE ORDER DETAILS - UPDATED FOR SUIT SYSTEM
const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { measurements, notes, referenceImage, customerSketch, dupattaDetails } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`📝 Update request - Order: ${id}, User: ${userId}, Role: ${role}`);
    console.log(`📋 Update data:`, {
      hasMeasurements: !!measurements,
      hasNotes: notes !== undefined,
      hasReferenceImage: !!referenceImage,
      hasCustomerSketch: !!customerSketch,
      hasDupattaDetails: !!dupattaDetails
    });

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
        msg: 'Not authorized to update this order' 
      });
    }

    if (order.isLocked) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: '🔒 This design is locked and cannot be edited. Ask the customer to unlock it first.',
        locked: true 
      });
    }

    if (!['pending', 'accepted', 'confirmed'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Order cannot be edited in current status (${order.status})` 
      });
    }

    // Update measurements
    if (measurements) {
      console.log('📏 Updating measurements');
      order.measurements = { ...order.measurements, ...measurements };
    }

    // Update notes
    if (notes !== undefined) {
      console.log('📝 Updating notes');
      order.notes = notes;
    }

    // Update dupatta details (for 3-piece)
    if (dupattaDetails && order.suitType === '3-piece') {
      console.log('👗 Updating dupatta details');
      order.dupattaDetails = { ...order.dupattaDetails, ...dupattaDetails };
    }

    // Process and update images
    try {
      if (referenceImage) {
        console.log('📸 Updating reference image');
        if (order.referenceImage?.publicId) {
          try {
            await deleteImage(order.referenceImage.publicId);
          } catch (delError) {
            console.error('⚠️ Failed to delete old reference image:', delError);
          }
        }
        const referenceImageData = await processImageUpload(referenceImage, 'reference');
        order.referenceImage = referenceImageData;
      }

      if (customerSketch) {
        console.log('✏️ Updating customer sketch');
        if (order.customerSketch?.publicId) {
          try {
            await deleteImage(order.customerSketch.publicId);
          } catch (delError) {
            console.error('⚠️ Failed to delete old sketch:', delError);
          }
        }
        const customerSketchData = await processImageUpload(customerSketch, 'sketch');
        order.customerSketch = customerSketchData;
      }
    } catch (imageError) {
      console.error('❌ Image update error:', imageError);
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: imageError.message || 'Failed to update images'
      });
    }

    order.updatedAt = new Date();
    await order.save();
    await order.populate('customer tailor');

    console.log('✅ Order updated successfully');

    res.json({ 
      success: true, 
      msg: 'Order updated successfully', 
      order 
    });
  } catch (error) {
    console.error('❌ Update order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating order',
      error: error.message 
    });
  }
};

// ✅ UPDATE ORDER STATUS
const updateOrderStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id: orderId } = req.params;
    const { status, price } = req.body;

    console.log(`📊 Status update - Order: ${orderId}, New status: ${status}, Role: ${role}`);

    if (role !== 'tailor') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Only tailors can update order status' 
      });
    }

    const order = await Order.findOne({ _id: orderId, tailor: userId });
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No order with id ${orderId} found for this tailor` 
      });
    }

    const validStatusTransitions = {
      pending: ['rejected', 'accepted'],
      accepted: ['confirmed', 'rejected'],
      confirmed: ['making'],
      making: ['payment_done'],
      payment_done: ['completed']
    };

    if (!validStatusTransitions[order.status]?.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: `Cannot transition from ${order.status} to ${status}` 
      });
    }

    const updateData = { status };
    let deliveryEstimate = null;

    if (status === 'accepted') {
      if (!price || price <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          msg: 'Valid price is required when accepting an order' 
        });
      }
      updateData.price = price;

      console.log('📊 Calculating delivery time for order:', orderId);
      deliveryEstimate = await calculateDeliveryTime(userId, price);
      
      updateData.estimatedDeliveryDays = deliveryEstimate.estimatedDays;
      updateData.expectedCompletionDate = deliveryEstimate.completionDate;
      updateData.deliveryConfidence = deliveryEstimate.confidence;

      console.log('✅ Delivery estimate calculated:', {
        days: deliveryEstimate.estimatedDays,
        date: deliveryEstimate.completionDate,
        confidence: deliveryEstimate.confidence
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer tailor');

    const notificationMessages = {
      accepted: `✅ Your order has been accepted. The price is PKR ${price}. Review and confirm to start collaboration.`,
      rejected: '❌ Your order has been rejected by the tailor',
      confirmed: '🎯 Your order has been confirmed and collaboration can begin',
      making: '⚙️ Your order is now being made',
      payment_done: '💰 Payment received for your order',
      completed: '✅ Your order has been completed and is ready for pickup'
    };

    if (notificationMessages[status]) {
      await Message.create({
        sender: userId,
        receiver: order.customer,
        content: notificationMessages[status],
        order: order._id
      });
    }

    if (status === 'accepted' && deliveryEstimate) {
      const suitDescription = order.suitType === '3-piece' ? 
        `${order.suitType} suit` : 
        `${order.suitType} suit`;
      
      const deliveryMessage = formatDeliveryMessage(
        deliveryEstimate, 
        suitDescription
      );

      await Message.create({
        sender: userId,
        receiver: order.customer,
        content: deliveryMessage,
        order: order._id
      });

      console.log('📨 Delivery estimate message sent to customer');
    }

    res.status(StatusCodes.OK).json({ 
      success: true, 
      order: updatedOrder,
      deliveryEstimate: deliveryEstimate ? {
        days: deliveryEstimate.estimatedDays,
        date: deliveryEstimate.completionDate,
        confidence: deliveryEstimate.confidence
      } : null
    });
  } catch (error) {
    console.error('❌ Update order status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating order status',
      error: error.message 
    });
  }
};

// ✅ CONFIRM ORDER
const confirmOrder = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id: orderId } = req.params;

    console.log(`✅ Confirm order - Order: ${orderId}, User: ${userId}, Role: ${role}`);

    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Only customers can confirm orders' 
      });
    }

    const order = await Order.findOne({ _id: orderId, customer: userId });
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No order with id ${orderId} found for this customer` 
      });
    }

    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Only accepted orders can be confirmed' 
      });
    }

    let deliveryUpdate = {};
    if (order.price && order.tailor) {
      const deliveryEstimate = await calculateDeliveryTime(order.tailor, order.price);
      
      deliveryUpdate = {
        estimatedDeliveryDays: deliveryEstimate.estimatedDays,
        expectedCompletionDate: deliveryEstimate.completionDate,
        deliveryConfidence: deliveryEstimate.confidence
      };

      console.log('📊 Updated delivery estimate on confirmation:', deliveryEstimate);
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { 
        status: 'confirmed',
        ...deliveryUpdate 
      },
      { new: true, runValidators: true }
    ).populate('customer tailor');

    await Message.create({
      sender: userId,
      receiver: order.tailor,
      content: '🎯 Order confirmed! You can now work together to finalize the design. Make any needed changes and wait for the customer to lock it.',
      order: order._id
    });

    if (deliveryUpdate.expectedCompletionDate) {
      const reminderDate = new Date(deliveryUpdate.expectedCompletionDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const suitDescription = order.suitType === '3-piece' ? 
        `${order.suitType} suit` : 
        `${order.suitType} suit`;

      await Message.create({
        sender: order.tailor,
        receiver: userId,
        content: `✅ Order confirmed! We'll have your ${suitDescription} ready by ${reminderDate} (approximately ${deliveryUpdate.estimatedDeliveryDays} days). Work with your tailor to finalize the design!`,
        order: order._id
      });
    }

    res.status(StatusCodes.OK).json({ 
      success: true, 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('❌ Confirm order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while confirming order',
      error: error.message 
    });
  }
};

// ✅ DELETE ORDER
const deleteOrder = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id: orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No order with id ${orderId}` 
      });
    }

    const isCustomer = role === 'customer' && order.customer.toString() === userId;
    const isTailor = role === 'tailor' && order.tailor.toString() === userId;

    if (!isCustomer && !isTailor) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Not authorized to delete this order' 
      });
    }

    try {
      if (order.referenceImage?.publicId) {
        console.log('🗑️ Deleting reference image:', order.referenceImage.publicId);
        await deleteImage(order.referenceImage.publicId);
      }
      if (order.customerSketch?.publicId) {
        console.log('🗑️ Deleting customer sketch:', order.customerSketch.publicId);
        await deleteImage(order.customerSketch.publicId);
      }
    } catch (imageError) {
      console.error('❌ Error deleting images:', imageError);
    }

    await Order.findByIdAndDelete(orderId);
    await Message.deleteMany({ order: orderId });

    res.status(StatusCodes.OK).json({ 
      success: true, 
      msg: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Delete order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while deleting order',
      error: error.message 
    });
  }
};
// NEW: Request price negotiation
const requestPriceNegotiation = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { userId, role } = req.user;

    console.log(`💬 Price negotiation requested - Order: ${orderId}, User: ${userId}`);

    // Only customers can request negotiation
    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: 'Only customers can request price negotiation'
      });
    }

    const order = await Order.findOne({ _id: orderId, customer: userId })
      .populate('customer tailor');

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Order not found'
      });
    }

    // Can only negotiate when status is 'accepted'
    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Price negotiation is only available for accepted orders'
      });
    }

    // Check if already requested
    if (order.priceNegotiationRequested) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Price negotiation has already been requested for this order'
      });
    }

    // Check if price was already changed
    if (order.priceChangedByTailor) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Price has already been negotiated and changed'
      });
    }

    // Mark negotiation as requested
    await order.requestPriceNegotiation();

    // Send notification to tailor
    await Message.create({
      sender: userId,
      receiver: order.tailor._id,
      content: `💰 Customer wants to negotiate the price of PKR ${order.price}. Please discuss and update the price if needed.`,
      order: order._id
    });

    console.log('✅ Price negotiation requested successfully');

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Price negotiation request sent to tailor',
      order
    });
  } catch (error) {
    console.error('❌ Request price negotiation error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Server error while requesting price negotiation',
      error: error.message
    });
  }
};

// NEW: Update price (tailor only, one-time)
const updateOrderPrice = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { price } = req.body;
    const { userId, role } = req.user;

    console.log(`💰 Price update request - Order: ${orderId}, New price: ${price}`);

    // Only tailors can update price
    if (role !== 'tailor') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        msg: 'Only tailors can update order price'
      });
    }

    // Validate price
    if (!price || price <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Valid price is required'
      });
    }

    const order = await Order.findOne({ _id: orderId, tailor: userId })
      .populate('customer tailor');

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: 'Order not found'
      });
    }

    // Can only update price when status is 'accepted'
    if (order.status !== 'accepted') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Price can only be updated for accepted orders'
      });
    }

    // Check if price was already changed
    if (order.priceChangedByTailor) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: 'Price has already been changed once and cannot be modified again',
        alreadyChanged: true
      });
    }

    // Update price
    await order.updatePrice(price, userId);

    // Send notification to customer
    await Message.create({
      sender: userId,
      receiver: order.customer._id,
      content: `✅ Price has been updated from PKR ${order.originalPrice} to PKR ${price}. Please review and confirm the order.`,
      order: order._id
    });

    console.log('✅ Price updated successfully');

    // Reload order with populated fields
    await order.populate('customer tailor');

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Price updated successfully',
      order,
      originalPrice: order.originalPrice,
      newPrice: price
    });
  } catch (error) {
    console.error('❌ Update price error:', error);
    
    if (error.message.includes('already been changed')) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: error.message,
        alreadyChanged: true
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: 'Server error while updating price',
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
  updateOrderDetails,
  lockOrder,
   requestPriceNegotiation,  // NEW
  updateOrderPrice    
};