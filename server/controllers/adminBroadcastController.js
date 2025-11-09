// server/controllers/adminBroadcastController.js
const User = require('../models/User');
const AdminMessage = require('../models/AdminMessage');
const { StatusCodes } = require('http-status-codes');

// Send broadcast message to users
const sendBroadcastMessage = async (req, res) => {
  try {
    const { content, recipientType } = req.body; // recipientType: 'all', 'customers', 'tailors'
    const adminId = req.user.userId;

    console.log('Admin broadcast:', { adminId, recipientType, contentLength: content?.length });

    // Validate input
    if (!content || content.trim().length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Message content is required'
      });
    }

    if (!['all', 'customers', 'tailors'].includes(recipientType)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid recipient type. Must be: all, customers, or tailors'
      });
    }

    // Build recipient filter
    let recipientFilter = { status: 'active' };
    
    if (recipientType === 'customers') {
      recipientFilter.role = 'customer';
    } else if (recipientType === 'tailors') {
      recipientFilter.role = 'tailor';
    } else if (recipientType === 'all') {
      recipientFilter.role = { $in: ['customer', 'tailor'] };
    }

    // Get all recipients
    const recipients = await User.find(recipientFilter).select('_id');
    const recipientIds = recipients.map(r => r._id);

    console.log(`Broadcasting to ${recipientIds.length} users`);

    // Create broadcast message
    const message = await AdminMessage.create({
      admin: adminId,
      content: content.trim(),
      recipientType,
      recipients: recipientIds,
      sentAt: new Date()
    });

    // Populate admin details
    await message.populate('admin', 'name email role');

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: `Message sent to ${recipientIds.length} ${recipientType === 'all' ? 'users' : recipientType}`,
      data: {
        message,
        recipientCount: recipientIds.length
      }
    });

  } catch (error) {
    console.error('Send broadcast message error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to send broadcast message',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all broadcast messages (admin view)
const getAllBroadcastMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, recipientType } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter = {};
    if (recipientType && ['all', 'customers', 'tailors'].includes(recipientType)) {
      filter.recipientType = recipientType;
    }

    // Get messages with pagination
    const [messages, total] = await Promise.all([
      AdminMessage.find(filter)
        .populate('admin', 'name email role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminMessage.countDocuments(filter)
    ]);

    // Add read count to each message
    const messagesWithStats = messages.map(msg => ({
      ...msg,
      totalRecipients: msg.recipients.length,
      readCount: msg.readBy.length,
      unreadCount: msg.recipients.length - msg.readBy.length
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        messages: messagesWithStats,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get broadcast messages error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch broadcast messages'
    });
  }
};

// Get user's admin messages (mobile app)
const getUserAdminMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    console.log(`Fetching admin messages for user: ${userId}`);

    // Find messages where user is a recipient
    const [messages, total] = await Promise.all([
      AdminMessage.find({
        recipients: userId
      })
        .populate('admin', 'name role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AdminMessage.countDocuments({
        recipients: userId
      })
    ]);

    // Mark messages as read and add isRead flag
    const messageIds = messages.map(m => m._id);
    
    // Update read status
    await AdminMessage.updateMany(
      {
        _id: { $in: messageIds },
        readBy: { $ne: userId }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    // Add isRead flag to each message
    const messagesWithReadStatus = messages.map(msg => ({
      ...msg,
      isRead: msg.readBy.some(id => id.toString() === userId.toString())
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        messages: messagesWithReadStatus,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get user admin messages error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch admin messages'
    });
  }
};

// Get unread admin messages count
const getUnreadAdminMessagesCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const unreadCount = await AdminMessage.countDocuments({
      recipients: userId,
      readBy: { $ne: userId }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch unread count'
    });
  }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const message = await AdminMessage.findById(messageId);

    if (!message) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Message not found'
      });
    }

    // Check if user is a recipient
    if (!message.recipients.some(id => id.toString() === userId.toString())) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You are not a recipient of this message'
      });
    }

    // Add user to readBy if not already there
    if (!message.readBy.some(id => id.toString() === userId.toString())) {
      message.readBy.push(userId);
      await message.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to mark message as read'
    });
  }
};

// Delete broadcast message (admin only)
const deleteBroadcastMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await AdminMessage.findByIdAndDelete(messageId);

    if (!message) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Message not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete broadcast message error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to delete message'
    });
  }
};

// Get broadcast statistics
const getBroadcastStats = async (req, res) => {
  try {
    const stats = await AdminMessage.aggregate([
      {
        $group: {
          _id: '$recipientType',
          totalMessages: { $sum: 1 },
          totalRecipients: { $sum: { $size: '$recipients' } },
          totalReads: { $sum: { $size: '$readBy' } }
        }
      }
    ]);

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        messageCount: stat.totalMessages,
        recipientCount: stat.totalRecipients,
        readCount: stat.totalReads,
        readRate: stat.totalRecipients > 0 
          ? ((stat.totalReads / stat.totalRecipients) * 100).toFixed(2) 
          : 0
      };
      return acc;
    }, {});

    res.status(StatusCodes.OK).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Get broadcast stats error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch broadcast statistics'
    });
  }
};

module.exports = {
  sendBroadcastMessage,
  getAllBroadcastMessages,
  getUserAdminMessages,
  getUnreadAdminMessagesCount,
  markMessageAsRead,
  deleteBroadcastMessage,
  getBroadcastStats
};