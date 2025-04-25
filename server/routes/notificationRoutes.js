const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All routes are protected - require authentication
router.use(protect);

// Get user notifications
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

// Delete all read notifications
router.delete('/read', deleteReadNotifications);

module.exports = router;
