// server/routes/adminBroadcastRoutes.js
const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');

const {
  sendBroadcastMessage,
  getAllBroadcastMessages,
  getUserAdminMessages,
  getUnreadAdminMessagesCount,
  markMessageAsRead,
  deleteBroadcastMessage,
  getBroadcastStats
} = require('../controllers/adminBroadcastController');

// Admin routes - require admin authentication
router.post('/broadcast', auth, requireAdmin, sendBroadcastMessage);
router.get('/broadcast', auth, requireAdmin, getAllBroadcastMessages);
router.get('/broadcast/stats', auth, requireAdmin, getBroadcastStats);
router.delete('/broadcast/:messageId', auth, requireAdmin, deleteBroadcastMessage);

// User routes - for mobile app (customers & tailors)
router.get('/my-messages', auth, getUserAdminMessages);
router.get('/my-messages/unread-count', auth, getUnreadAdminMessagesCount);
router.patch('/my-messages/:messageId/read', auth, markMessageAsRead);

module.exports = router;