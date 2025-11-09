// server/models/AdminMessage.js
const mongoose = require('mongoose');

const AdminMessageSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID is required']
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message content cannot exceed 2000 characters']
    },
    recipientType: {
      type: String,
      enum: ['all', 'customers', 'tailors'],
      required: [true, 'Recipient type is required']
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient queries
AdminMessageSchema.index({ recipients: 1, createdAt: -1 });
AdminMessageSchema.index({ admin: 1, createdAt: -1 });
AdminMessageSchema.index({ recipientType: 1, createdAt: -1 });

// Virtual for read count
AdminMessageSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Virtual for total recipients count
AdminMessageSchema.virtual('recipientCount').get(function() {
  return this.recipients ? this.recipients.length : 0;
});

// Virtual for unread count
AdminMessageSchema.virtual('unreadCount').get(function() {
  return (this.recipients ? this.recipients.length : 0) - (this.readBy ? this.readBy.length : 0);
});

// Static method to get unread count for a user
AdminMessageSchema.statics.getUnreadCountForUser = async function(userId) {
  return this.countDocuments({
    recipients: userId,
    readBy: { $ne: userId }
  });
};

// Static method to mark message as read
AdminMessageSchema.statics.markAsReadByUser = async function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { readBy: userId }
    },
    { new: true }
  );
};

module.exports = mongoose.model('AdminMessage', AdminMessageSchema);