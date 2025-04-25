const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get chat list (conversations)
// @route   GET /api/chat/list
// @access  Private
exports.getChatList = async (req, res, next) => {
  try {
    // Find all users that the current user has chatted with
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: mongoose.Types.ObjectId(req.user.id) },
            { receiverId: mongoose.Types.ObjectId(req.user.id) }
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
              { $eq: ["$senderId", mongoose.Types.ObjectId(req.user.id)] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$$ROOT" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: 1,
            name: 1,
            email: 1,
            role: 1
          },
          lastMessage: {
            _id: 1,
            content: 1,
            createdAt: 1,
            isRead: 1
          }
        }
      }
    ]);

    // Count unread messages for each conversation
    const chatList = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          senderId: conv._id,
          receiverId: req.user.id,
          isRead: false
        });

        return {
          user: conv.user,
          lastMessage: {
            text: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt
          },
          unreadCount
        };
      })
    );

    res.status(200).json({
      success: true,
      data: chatList
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages between two users
// @route   GET /api/chat/messages/:userId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get messages between current user and the other user
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: -1 }); // Newest first for easier client-side handling

    // Mark all unread messages as read
    await Message.updateMany(
      {
        senderId: userId,
        receiverId: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/chat/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide receiverId and content'
      });
    }

    // Check if the receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create the message
    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      content,
      isRead: false
    });

    // Create a notification for the receiver
    await Notification.create({
      recipient: receiverId,
      title: 'New Message',
      message: `You have received a new message from ${req.user.name}`,
      type: 'message',
      referenceId: message._id,
      senderId: req.user.id,
      senderName: req.user.name
    });

    // Emit the message to the connected socket
    const io = req.app.get('io');
    if (io) {
      io.to(receiverId).emit('new_message', message);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as read
// @route   PUT /api/chat/messages/:id/read
// @access  Private
exports.markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only the receiver can mark a message as read
    if (message.receiverId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this message as read'
      });
    }

    // Update message
    message.isRead = true;
    await message.save();

    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};
