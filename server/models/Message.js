const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    attachmentUrl: {
      type: String
    },
    attachmentType: {
      type: String,
      enum: ['image', 'document', 'other', '']
    }
  },
  {
    timestamps: true
  }
);

// Add indexes for better query performance
MessageSchema.index({ senderId: 1, receiverId: 1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

module.exports = mongoose.model('Message', MessageSchema);
