const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['order', 'message', 'system'],
      default: 'system'
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      // This can reference different collections based on the notification type
      // For example, orders, messages, etc.
    },
    isRead: {
      type: Boolean,
      default: false
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Add an index for looking up a user's notifications
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
