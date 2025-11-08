// server/routes/analytics.js - Analytics API Routes
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// All analytics routes require admin/superadmin authorization
router.use(protect);
router.use(authorize('admin', 'superadmin', 'support'));

/**
 * @route   GET /api/v1/admin/analytics/metrics
 * @desc    Get comprehensive analytics metrics
 * @access  Admin/SuperAdmin/Support
 * @query   timeRange - 24h, 7d, 30d, 90d, 1y (default: 7d)
 */
router.get('/metrics', analyticsController.getMetrics);

/**
 * @route   GET /api/v1/admin/analytics/export
 * @desc    Export analytics report
 * @access  Admin/SuperAdmin/Support
 * @query   timeRange - 24h, 7d, 30d, 90d, 1y (default: 7d)
 * @query   format - csv, json (default: csv)
 */
router.get('/export', analyticsController.exportReport);

module.exports = router;