const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');

// Create a new order
const createOrder = async (req, res) => {
  // Extract user info from req.user, checking for both possible property names
  const userId = req.user.userId || req.user.id;
  const { role } = req.user;
  
  // Debug log to see what's coming through
  console.log('User info in createOrder:', { userId, role, fullUser: req.user });
  
  // Only customers can create orders
  if (role !== 'customer') {
    throw new UnauthenticatedError('Only customers can create orders');
  }
  
  if (!userId) {
    throw new BadRequestError('Customer ID is required');
  }      
  
  const { tailorId, garmentType, measurements, notes } = req.body;
  
  // Validate tailor exists
  const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${tailorId}`);
  }
  
  // Create order using the userId from the authenticated user
  const order = await Order.create({
    customer: userId,  // This is already correct - using the authenticated user's ID
    tailor: tailorId,
    garmentType,
    measurements,
    notes,
    status: 'pending'
  });
  
  // Send initial message to tailor
  await Message.create({
    sender: userId,
    receiver: tailorId,
    content: `New order request for ${garmentType}`,
    order: order._id
  });
  
  res.status(StatusCodes.CREATED).json({ order });
};

// Update order status (for tailors)
const updateOrderStatus = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;
  const { status, price } = req.body;
  
  // Only tailors can update order status
  if (role !== 'tailor') {
    throw new UnauthenticatedError('Only tailors can update order status');
  }
  
  // Find the order and ensure it belongs to this tailor
  const order = await Order.findOne({ _id: orderId, tailor: userId });
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId} found for this tailor`);
  }
  
  // Validate status transition
  const validStatusTransitions = {
    pending: ['rejected', 'accepted'],
    accepted: ['confirmed', 'rejected'],
    confirmed: ['making'],
    making: ['payment_done'],
    payment_done: ['completed']
  };
  
  if (!validStatusTransitions[order.status]?.includes(status)) {
    throw new BadRequestError(`Cannot transition from ${order.status} to ${status}`);
  }
  
  // Update order
  const updateData = { status };
  
  // If status is 'accepted', price is required
  if (status === 'accepted' && !price) {
    throw new BadRequestError('Price is required when accepting an order');
  }
  
  if (price !== undefined) {
    updateData.price = price;
  }
  
  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    updateData,
    { new: true, runValidators: true }
  ).populate('customer', 'name');
  
  // Create notification message for customer
  const notificationMessages = {
    accepted: `Your order has been accepted. The price is ${price}`,
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
  
  res.status(StatusCodes.OK).json({ order: updatedOrder });
};

// Customer accepts price and confirms order
const confirmOrder = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;
  
  // Only customers can confirm orders
  if (role !== 'customer') {
    throw new UnauthenticatedError('Only customers can confirm orders');
  }
  
  // Find the order and ensure it belongs to this customer
  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId} found for this customer`);
  }
  
  // Ensure order is in 'accepted' status
  if (order.status !== 'accepted') {
    throw new BadRequestError('Only accepted orders can be confirmed');
  }
  
  // Update order status to confirmed
  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    { status: 'confirmed' },
    { new: true, runValidators: true }
  ).populate('tailor', 'name');
  
  // Notify tailor
  await Message.create({
    sender: userId,
    receiver: order.tailor,
    content: 'Order confirmed. You can start working on it.',
    order: order._id
  });
  
  res.status(StatusCodes.OK).json({ order: updatedOrder });
};

const deleteOrder = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;

  console.log(`DELETE REQUEST for Order ID: ${orderId}, Role: ${role}, UserID: ${userId}`);

  const order = await Order.findById(orderId);
  if (!order) {
    console.log('Order not found');
    throw new NotFoundError(`No order with id ${orderId}`);
  }

  console.log('Order found:', order);

  const isCustomer = role === 'customer' && order.customer.toString() === userId;
  const isTailor = role === 'tailor' && order.tailor.toString() === userId;

  if (!isCustomer && !isTailor) {
    console.log('Unauthorized user attempted deletion');
    throw new UnauthenticatedError('Not authorized to delete this order');
  }

  await Order.findByIdAndDelete(orderId);
  console.log('Order deleted from DB');

  await Message.deleteMany({ order: orderId });
  console.log('Associated messages deleted');

  res.status(StatusCodes.OK).json({ msg: 'Order deleted successfully' });
};



module.exports = {
  createOrder,
  updateOrderStatus,
  confirmOrder,
  deleteOrder
};
