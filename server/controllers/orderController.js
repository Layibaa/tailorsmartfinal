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

// ✅ FIXED: Validate and process image data
const processImageUpload = async (imageData, type) => {
  if (!imageData) return null;
  
  try {
    // Validate base64 format
    if (!imageData.startsWith('data:image/')) {
      console.error('❌ Invalid image format:', imageData.substring(0, 50));
      throw new Error('Invalid image format. Must be base64 encoded image.');
    }
    
    // Check size (approximate, base64 is ~33% larger than original)
    const sizeInBytes = (imageData.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    console.log(`📊 Image size check: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);
    
    if (sizeInBytes > maxSize) {
      throw new Error('Image size exceeds 5MB limit');
    }
    
    // Upload to Cloudinary
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

// ✅ FIXED: CREATE ORDER
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
      garmentType, 
      measurements, 
      notes,
      referenceImage,
      customerSketch
    } = req.body;
    
    console.log('📋 Order data received:', {
      tailorId,
      garmentType,
      measurements,
      hasReferenceImage: !!referenceImage,
      hasCustomerSketch: !!customerSketch,
      referenceImagePrefix: referenceImage?.substring(0, 30),
      customerSketchPrefix: customerSketch?.substring(0, 30)
    });

    // Validate tailor
    const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
    if (!tailor) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No tailor found with id ${tailorId}` 
      });
    }

    // ✅ FIXED: Process image uploads with better error handling
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

    // Create order
    console.log('💾 Creating order in database...');
    const order = await Order.create({
      customer: userId,
      tailor: tailorId,
      garmentType,
      measurements,
      notes,
      status: 'pending',
      isLocked: false,
      referenceImage: referenceImageData,
      customerSketch: customerSketchData
    });

    console.log('✅ Order created:', order._id);

    // Create notification message
    const messageContent = `New order request for ${garmentType}${referenceImageData || customerSketchData ? ' (includes design reference)' : ''}`;
    
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
    console.error('❌ Create order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while creating order',
      error: error.message 
    });
  }
};

// ---------------- GET ORDER DETAILS ----------------
const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`Getting order ${id} for user ${userId} with role ${role}`);

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

    console.log(`Order found: ${order._id}, isLocked: ${order.isLocked}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while fetching order details',
      error: error.message 
    });
  }
};

// ---------------- LOCK/UNLOCK ORDER ----------------
const lockOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`Lock request - Order: ${id}, User: ${userId}, Role: ${role}, isLocked: ${isLocked}`);

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

    console.log(`Order found - Customer: ${order.customer._id}, Current lock: ${order.isLocked}`);

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

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Order cannot be locked/unlocked in current status. Only pending or accepted orders can be locked.' 
      });
    }

    order.isLocked = isLocked;
    order.updatedAt = new Date();
    const savedOrder = await order.save();

    console.log(`Order lock updated successfully: ${savedOrder.isLocked}`);

    if (order.tailor) {
      try {
        await Message.create({
          sender: userId,
          receiver: order.tailor._id,
          content: `Customer has ${isLocked ? 'locked' : 'unlocked'} the order design. ${isLocked ? 'No further changes can be made.' : 'Changes can now be requested.'}`,
          order: order._id
        });
        console.log('Notification sent to tailor');
      } catch (msgError) {
        console.error('Failed to send notification:', msgError);
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
    console.error('Lock order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating lock status',
      error: error.message 
    });
  }
};  

// ---------------- UPDATE ORDER DETAILS ----------------
const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { measurements, notes } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`Update request - Order: ${id}, User: ${userId}, Role: ${role}`);

    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: 'Order not found' 
      });
    }

    if (role !== 'customer' || order.customer._id.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to update this order' 
      });
    }

    if (order.isLocked) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'This design is locked and cannot be edited.',
        locked: true 
      });
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Order cannot be edited in current status' 
      });
    }

    if (measurements) {
      order.measurements = { ...order.measurements, ...measurements };
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    order.updatedAt = new Date();
    await order.save();
    await order.populate('customer tailor');

    console.log('Order updated successfully');

    res.json({ 
      success: true, 
      msg: 'Order updated successfully', 
      order 
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating order',
      error: error.message 
    });
  }
};

// ---------------- UPDATE ORDER STATUS ----------------
const updateOrderStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id: orderId } = req.params;
    const { status, price } = req.body;

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

    // ✨ NEW: Calculate delivery time when accepting order
    if (status === 'accepted') {
      if (!price || price <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          msg: 'Valid price is required when accepting an order' 
        });
      }
      updateData.price = price;

      // Calculate delivery time based on workload
      console.log('📊 Calculating delivery time for order:', orderId);
      deliveryEstimate = await calculateDeliveryTime(userId, price);
      
      updateData.estimatedDeliveryDays = deliveryEstimate.estimatedDays;
      updateData.expectedCompletionDate = deliveryEstimate.completionDate;
      updateData.deliveryConfidence = deliveryEstimate.confidence;

      console.log('Delivery estimate calculated:', {
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
      accepted: `Your order has been accepted. The price is PKR ${price}`,
      rejected: 'Your order has been rejected by the tailor',
      confirmed: 'Your order has been confirmed and is in progress',
      making: 'Your order is now being made',
      payment_done: 'Payment received for your order',
      completed: 'Your order has been completed and is ready for pickup'
    };

    // Send status notification
    if (notificationMessages[status]) {
      await Message.create({
        sender: userId,
        receiver: order.customer,
        content: notificationMessages[status],
        order: order._id
      });
    }

    // ✨ NEW: Send delivery time estimate message
    if (status === 'accepted' && deliveryEstimate) {
      const deliveryMessage = formatDeliveryMessage(
        deliveryEstimate, 
        order.garmentType
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
    console.error('Update order status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while updating order status',
      error: error.message 
    });
  }
};

// ---------------- CONFIRM ORDER ----------------
const confirmOrder = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { id: orderId } = req.params;

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

    // ✨ NEW: Recalculate delivery estimate when confirmed
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

    // Notify tailor
    await Message.create({
      sender: userId,
      receiver: order.tailor,
      content: 'Order confirmed. You can start working on it.',
      order: order._id
    });

    // ✨ NEW: Send updated delivery reminder to customer
    if (deliveryUpdate.expectedCompletionDate) {
      const reminderDate = new Date(deliveryUpdate.expectedCompletionDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      await Message.create({
        sender: order.tailor,
        receiver: userId,
        content: `Order confirmed! We'll have your ${order.garmentType} ready by ${reminderDate} (approximately ${deliveryUpdate.estimatedDeliveryDays} days). Thank you for your patience!`,
        order: order._id
      });
    }

    res.status(StatusCodes.OK).json({ 
      success: true, 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while confirming order',
      error: error.message 
    });
  }
};

// ---------------- DELETE ORDER ----------------
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

    // Delete images from Cloudinary before deleting order
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
      // Continue with order deletion even if image deletion fails
    }

    await Order.findByIdAndDelete(orderId);
    await Message.deleteMany({ order: orderId });

    res.status(StatusCodes.OK).json({ 
      success: true, 
      msg: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      msg: 'Server error while deleting order',
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
  lockOrder
};