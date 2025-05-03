const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  sendMessage, 
  getConversation, 
  getAllConversations,
  getUnreadCount
} = require('../controllers/messageController');

// Message routes
router.post('/', auth, sendMessage);
router.get('/conversations', auth, getAllConversations);
router.get('/conversations/:receiverId', auth, getConversation);
router.get('/unread', auth, getUnreadCount);

// Mark conversation as read
router.patch('/conversations/:receiverId/read', auth, async (req, res) => {
  const { userId } = req.user;
  const { receiverId } = req.params;
  
  await Message.updateMany(
    { sender: receiverId, receiver: userId, read: false },
    { read: true }
  );
  
  res.status(200).json({ success: true });
});

module.exports = router;