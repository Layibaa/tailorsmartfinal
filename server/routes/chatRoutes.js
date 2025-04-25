const express = require('express');
const router = express.Router();
const {
  getChatList,
  getMessages,
  sendMessage,
  markMessageAsRead
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// All routes are protected - require authentication
router.use(protect);

// Get chat list (conversations)
router.get('/list', getChatList);

// Get messages between current user and another user
router.get('/messages/:userId', getMessages);

// Send a message
router.post('/messages', sendMessage);

// Mark message as read
router.put('/messages/:id/read', markMessageAsRead);

module.exports = router;
