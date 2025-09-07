const Message = require('../models/Message');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const mongoose = require('mongoose');

// Send a message
const sendMessage = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: error.message
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error sending message'
    });
  }
};

// Get conversation with another user
const getConversation = async (req, res) => {
  try {
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
    
    // Return messages directly as the frontend expects
    res.status(StatusCodes.OK).json({ messages });
  } catch (error) {
    console.error('Error getting conversation:', error);
    if (error instanceof NotFoundError) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: error.message
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error getting conversation'
    });
  }
};

// Get all conversations for the current user
const getAllConversations = async (req, res) => {
  try {
    const { userId } = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get all unique users the current user has conversed with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId }
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
              { $eq: ['$sender', userObjectId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', userObjectId] },
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
  } catch (error) {
    console.error('Error getting all conversations:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error getting conversations'
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.status(StatusCodes.OK).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error getting unread count'
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount
};