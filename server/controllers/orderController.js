const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');

// ---------------- CREATE ORDER ----------------
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    if (role !== 'customer') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        msg: 'Only customers can create orders' 
      });
    }

    const { tailorId, garmentType, measurements, notes } = req.body;
    
    const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
    if (!tailor) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: `No tailor found with id ${tailorId}` 
      });
    }

    const order = await Order.create({
      customer: userId,
      tailor: tailorId,
      garmentType,
      measurements,
      notes,
      status: 'pending',
      isLocked: false
    });

    // Create notification message
    await Message.create({
      sender: userId,
      receiver: tailorId,
      content: `New order request for ${garmentType}`,
      order: order._id
    });

    // Populate order data for response
    await order.populate('customer tailor');

    res.status(StatusCodes.CREATED).json({ success: true, order });
  } catch (error) {
    console.error('Create order error:', error);
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

// ---------------- LOCK/UNLOCK ORDER - FIXED ----------------
const lockOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body;
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;

    console.log(`Lock request - Order: ${id}, User: ${userId}, Role: ${role}, isLocked: ${isLocked}`);

    // Validate input - THIS WAS THE MAIN ISSUE
    if (typeof isLocked !== 'boolean') {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'isLocked must be a boolean value',
        received: typeof isLocked,
        value: isLocked
      });
    }

    // Find order
    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        msg: 'Order not found' 
      });
    }

    console.log(`Order found - Customer: ${order.customer._id}, Current lock: ${order.isLocked}`);

    // Only customer can lock/unlock their own orders
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

    // Check if order status allows locking/unlocking
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Order cannot be locked/unlocked in current status. Only pending or accepted orders can be locked.' 
      });
    }

    // FIXED: Direct assignment instead of using findByIdAndUpdate
    order.isLocked = isLocked;
    order.updatedAt = new Date();
    const savedOrder = await order.save();

    console.log(`Order lock updated successfully: ${savedOrder.isLocked}`);

    // Send notification to tailor
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
        // Don't fail the request if notification fails
      }
    }

    // FIXED: Return the saved order with populated data
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

    // Only customer can update their orders
    if (role !== 'customer' || order.customer._id.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({ 
        msg: 'Not authorized to update this order' 
      });
    }

    // Check if order is locked
    if (order.isLocked) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'This design is locked and cannot be edited.',
        locked: true 
      });
    }

    // Check if order status allows editing
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        msg: 'Order cannot be edited in current status' 
      });
    }

    // Update measurements
    if (measurements) {
      order.measurements = { ...order.measurements, ...measurements };
    }

    // Update notes
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
    if (status === 'accepted') {
      if (!price || price <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ 
          msg: 'Valid price is required when accepting an order' 
        });
      }
      updateData.price = price;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer tailor');

    // Send notification
    const notificationMessages = {
      accepted: `Your order has been accepted. The price is PKR ${price}`,
      rejected: 'Your order has been rejected by the tailor',
      confirmed: 'Your order has been confirmed and is in progress',
      making: 'Your order is now being made',
      payment_done: 'Payment received for your order',
      completed: 'Your order has been completed and is ready for pickup'
    };

    if (notificationMessages[status]) {
      await Message.create({
        sender: userId,
        receiver: order.customer,
        content: notificationMessages[status],
        order: order._id
      });
    }

    res.status(StatusCodes.OK).json({ 
      success: true, 
      order: updatedOrder 
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

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: 'confirmed' },
      { new: true, runValidators: true }
    ).populate('customer tailor');

    await Message.create({
      sender: userId,
      receiver: order.tailor,
      content: 'Order confirmed. You can start working on it.',
      order: order._id
    });

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
  getOrderDetails,  // ✅ Export the new function
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  updateOrderDetails,
  lockOrder
};