const Order = require('../models/Order');
const User = require('../models/User');
const Message = require('../models/Message');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');

// ---------------- CREATE ORDER ----------------
const createOrder = async (req, res) => {
  const userId = req.user.userId || req.user.id;
  const { role } = req.user;

  if (role !== 'customer') {
    throw new UnauthenticatedError('Only customers can create orders');
  }
  if (!userId) {
    throw new BadRequestError('Customer ID is required');
  }

  const { tailorId, garmentType, measurements, notes } = req.body;
  const tailor = await User.findOne({ _id: tailorId, role: 'tailor' });
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${tailorId}`);
  }

  const order = await Order.create({
    customer: userId,
    tailor: tailorId,
    garmentType,
    measurements,
    notes,
    status: 'pending'
  });

  await Message.create({
    sender: userId,
    receiver: tailorId,
    content: `New order request for ${garmentType}`,
    order: order._id
  });

  res.status(StatusCodes.CREATED).json({ order });
};

// ---------------- UPDATE ORDER STATUS ----------------
const updateOrderStatus = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;
  const { status, price } = req.body;

  if (role !== 'tailor') {
    throw new UnauthenticatedError('Only tailors can update order status');
  }

  const order = await Order.findOne({ _id: orderId, tailor: userId });
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId} found for this tailor`);
  }

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

  const updateData = { status };
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

// ---------------- CONFIRM ORDER (CUSTOMER) ----------------
const confirmOrder = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;

  if (role !== 'customer') {
    throw new UnauthenticatedError('Only customers can confirm orders');
  }

  const order = await Order.findOne({ _id: orderId, customer: userId });
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId} found for this customer`);
  }

  if (order.status !== 'accepted') {
    throw new BadRequestError('Only accepted orders can be confirmed');
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    { status: 'confirmed' },
    { new: true, runValidators: true }
  ).populate('tailor', 'name');

  await Message.create({
    sender: userId,
    receiver: order.tailor,
    content: 'Order confirmed. You can start working on it.',
    order: order._id
  });

  res.status(StatusCodes.OK).json({ order: updatedOrder });
};

// ---------------- DELETE ORDER ----------------
const deleteOrder = async (req, res) => {
  const { userId, role } = req.user;
  const { id: orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId}`);
  }

  const isCustomer = role === 'customer' && order.customer.toString() === userId;
  const isTailor = role === 'tailor' && order.tailor.toString() === userId;

  if (!isCustomer && !isTailor) {
    throw new UnauthenticatedError('Not authorized to delete this order');
  }

  await Order.findByIdAndDelete(orderId);
  await Message.deleteMany({ order: orderId });

  res.status(StatusCodes.OK).json({ msg: 'Order deleted successfully' });
};

// ---------------- UPDATE ORDER DETAILS ----------------
const updateOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { measurements, notes } = req.body;

    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    const userId = req.user.userId || req.user.id;
    if (req.user.role !== 'customer' || order.customer._id.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized to update this order' });
    }

    if (order.isLocked) {
      return res.status(400).json({ msg: 'Cannot update locked order' });
    }
    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ msg: 'Order cannot be edited in current status' });
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

    res.json({ success: true, msg: 'Order updated successfully', order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ msg: 'Server error while updating order' });
  }
};

// ---------------- LOCK / UNLOCK ORDER ----------------
const lockOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { isLocked } = req.body; // allow lock/unlock
    const userId = req.user.userId || req.user.id;

    const order = await Order.findById(id).populate('customer tailor');
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (req.user.role !== 'customer' || order.customer._id.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized to lock/unlock this order' });
    }

    if (!['pending', 'accepted'].includes(order.status)) {
      return res.status(400).json({ msg: 'Order cannot be locked/unlocked in current status' });
    }

    order.isLocked = isLocked;
    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      msg: `Order ${isLocked ? 'locked' : 'unlocked'} successfully`,
      order
    });
  } catch (error) {
    console.error('Lock order error:', error);
    res.status(500).json({ msg: 'Server error while updating lock status' });
  }
};

module.exports = {
  createOrder,
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  updateOrderDetails, // ✅ new
  lockOrder           // ✅ upgraded
};
