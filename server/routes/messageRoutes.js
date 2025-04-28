const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers
const { 
  sendMessage, 
  getConversation, 
  getAllConversations 
} = require('../controllers/messageController');

// Connect routes to controller functions
router.post('/', auth, sendMessage);
router.get('/conversations', auth, getAllConversations);
router.get('/conversations/:userId', auth, getConversation);

module.exports = router;