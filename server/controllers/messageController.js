const Message = require('../models/Message');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

// Send a message
const sendMessage = async (req, res) => {
  const { userId } = req.user;
  const { receiverId, content, orderId } = req.body;
  
  // Validate receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new NotFoundError(`No user with id ${receiverId}`);
  }
  
  // Create message
  const message = await Message.create({
    sender: userId,
    receiver: receiverId,
    content,
    order: orderId || null
  });
  
  res.status(StatusCodes.CREATED).json({ message });
};

// Get conversation with another user
const getConversation = async (req, res) => {
  const { userId } = req.user;
  const { receiverId } = req.params;
  
  // Validate other user exists
  const otherUser = await User.findById(receiverId);
  if (!otherUser) {
    throw new NotFoundError(`No user with id ${receiverId}`);
  }
  
  // Find messages between the two users
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: receiverId },
      { sender: receiverId, receiver: userId }
    ]
  }).sort('createdAt');
  
  // Mark messages as read if they were sent to the current user
  await Message.updateMany(
    { sender: receiverId, receiver: userId, read: false },
    { read: true }
  );
  
  res.status(StatusCodes.OK).json({ 
    count: messages.length, 
    otherUser: {
      id: otherUser._id,
      name: otherUser.name,
      role: otherUser.role
    },
    messages 
  });
};

// Get all conversations for the current user
const getAllConversations = async (req, res) => {
  const { userId } = req.user;
  
  // Get all unique users the current user has conversed with
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: userId },
          { receiver: userId }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
            '$receiver',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$receiver', userId] },
                { $eq: ['$read', false] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: '$userInfo'
    },
    {
      $project: {
        _id: 1,
        lastMessage: 1,
        unreadCount: 1,
        'userInfo.name': 1,
        'userInfo.role': 1
      }
    }
  ]);
  
  res.status(StatusCodes.OK).json({ 
    count: conversations.length, 
    conversations 
  });
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  const { userId } = req.user;
  
  const unreadCount = await Message.countDocuments({
    receiver: userId,
    read: false
  });
  
  res.status(StatusCodes.OK).json({ unreadCount });
};

module.exports = {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount
};
