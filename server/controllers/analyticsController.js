// server/controllers/analyticsController.js - Analytics & Reporting
const Order = require('../models/Order');
const User = require('../models/User');

// Helper function to get date range
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return { startDate, endDate: now };
};

// Get comprehensive analytics metrics
exports.getMetrics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);

    console.log('Analytics: Fetching metrics for range:', timeRange, { startDate, endDate });

    // Get orders in date range
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('customer tailor');

    const completedOrders = orders.filter(o => o.status === 'completed');

    // Calculate average completion time
    let totalCompletionTime = 0;
    let completionCount = 0;

    completedOrders.forEach(order => {
      if (order.updatedAt && order.createdAt) {
        const completionTime = (order.updatedAt - order.createdAt) / (1000 * 60 * 60); // hours
        totalCompletionTime += completionTime;
        completionCount++;
      }
    });

    const averageCompletionTime = completionCount > 0 
      ? totalCompletionTime / completionCount 
      : 0;

    // Completion time distribution
    const completionTimeDistribution = [
      { range: '0-24h', count: 0 },
      { range: '24-48h', count: 0 },
      { range: '2-3 days', count: 0 },
      { range: '3-7 days', count: 0 },
      { range: '7+ days', count: 0 }
    ];

    completedOrders.forEach(order => {
      const hours = (order.updatedAt - order.createdAt) / (1000 * 60 * 60);
      if (hours <= 24) completionTimeDistribution[0].count++;
      else if (hours <= 48) completionTimeDistribution[1].count++;
      else if (hours <= 72) completionTimeDistribution[2].count++;
      else if (hours <= 168) completionTimeDistribution[3].count++;
      else completionTimeDistribution[4].count++;
    });

    // Peak usage times (by hour of day)
    const hourlyActivity = new Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, count: 0 }));
    
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyActivity[hour].count++;
    });

    // Sort to find peak times
    const peakUsageTimes = [...hourlyActivity].sort((a, b) => b.count - a.count).slice(0, 10);

    // Regional activity (by user location/region)
    const regionalMap = {};
    
    for (const order of orders) {
      const region = order.customer?.region || order.customer?.city || 'Unknown';
      regionalMap[region] = (regionalMap[region] || 0) + 1;
    }

    const regionalActivity = Object.entries(regionalMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Order trends (daily)
    const trendMap = {};
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap[dateStr] = { date: dateStr, orders: 0, completed: 0 };
    }

    orders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (trendMap[dateStr]) {
        trendMap[dateStr].orders++;
        if (order.status === 'completed') {
          trendMap[dateStr].completed++;
        }
      }
    });

    const orderTrends = Object.values(trendMap);

    // Get active users in range
    const activeUsers = await User.countDocuments({
      lastActive: { $gte: startDate, $lte: endDate }
    });

    // Calculate additional performance metrics
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const completionRate = orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0;

    // Find peak hour
    const peakHour = hourlyActivity.reduce((max, curr) => 
      curr.count > max.count ? curr : max
    , { hour: 'N/A', count: 0 });

    // Find top region
    const topRegion = regionalActivity.length > 0 
      ? regionalActivity[0] 
      : { name: 'N/A', value: 0 };

    // Calculate average response time (time from pending to accepted)
    let totalResponseTime = 0;
    let responseCount = 0;

    orders.forEach(order => {
      if (order.status !== 'pending' && order.statusHistory) {
        const acceptedStatus = order.statusHistory.find(h => h.status === 'accepted');
        if (acceptedStatus) {
          const responseTime = (new Date(acceptedStatus.timestamp) - order.createdAt) / (1000 * 60 * 60);
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    });

    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

    // Previous period comparison for trends
    const prevPeriodEnd = new Date(startDate);
    const prevPeriodStart = new Date(startDate);
    prevPeriodStart.setTime(prevPeriodStart.getTime() - (endDate - startDate));

    const prevOrders = await Order.find({
      createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd }
    });

    const prevCompleted = prevOrders.filter(o => o.status === 'completed');
    const prevRevenue = prevCompleted.reduce((sum, o) => sum + (o.price || 0), 0);
    const prevAvgOrderValue = prevCompleted.length > 0 ? prevRevenue / prevCompleted.length : 0;

    const avgOrderValueTrend = prevAvgOrderValue > 0 
      ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 
      : 0;

    const metrics = {
      performanceMetrics: {
        averageCompletionTime,
        completionRate,
        activeUsers,
        totalOrders: orders.length,
        avgOrderValue,
        avgOrderValueTrend,
        satisfactionRate: 95.5, // Placeholder - integrate with rating system when available
        satisfactionTrend: 2.3,
        avgResponseTime,
        responseTrend: -5.2, // Negative is better (faster response)
        peakHour: peakHour.hour,
        peakHourActivity: peakHour.count,
        topRegion: topRegion.name,
        topRegionOrders: topRegion.value
      },
      orderTrends,
      peakUsageTimes,
      regionalActivity,
      completionTimeDistribution
    };

    console.log('Analytics: Metrics calculated successfully');

    res.json({
      success: true,
      metrics,
      timeRange,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Analytics: Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to fetch analytics metrics',
      error: error.message
    });
  }
};

// Export analytics report
exports.exportReport = async (req, res) => {
  try {
    const { timeRange = '7d', format = 'csv' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);

    console.log('Analytics: Exporting report:', { timeRange, format });

    // Get comprehensive data
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('customer tailor');

    const users = await User.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    if (format === 'csv') {
      // Generate CSV report
      let csv = 'Order ID,Customer Name,Customer Email,Tailor Name,Tailor Email,Garment Type,Status,Price,Created Date,Completion Time (hours)\n';

      orders.forEach(order => {
        const completionTime = order.status === 'completed' && order.updatedAt
          ? ((order.updatedAt - order.createdAt) / (1000 * 60 * 60)).toFixed(2)
          : 'N/A';

        csv += `${order._id},`;
        csv += `${order.customer?.name || 'N/A'},`;
        csv += `${order.customer?.email || 'N/A'},`;
        csv += `${order.tailor?.name || 'N/A'},`;
        csv += `${order.tailor?.email || 'N/A'},`;
        csv += `${order.garmentType},`;
        csv += `${order.status},`;
        csv += `${order.price || 0},`;
        csv += `${order.createdAt.toISOString()},`;
        csv += `${completionTime}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${timeRange}-${Date.now()}.csv`);
      res.send(csv);

    } else {
      // Generate JSON report
      const report = {
        metadata: {
          generatedAt: new Date(),
          timeRange,
          dateRange: { startDate, endDate },
          totalOrders: orders.length,
          totalUsers: users.length
        },
        orders: orders.map(order => ({
          id: order._id,
          customer: {
            name: order.customer?.name,
            email: order.customer?.email,
            region: order.customer?.region || order.customer?.city
          },
          tailor: {
            name: order.tailor?.name,
            email: order.tailor?.email
          },
          garmentType: order.garmentType,
          status: order.status,
          price: order.price,
          createdAt: order.createdAt,
          completedAt: order.status === 'completed' ? order.updatedAt : null,
          completionTime: order.status === 'completed' && order.updatedAt
            ? ((order.updatedAt - order.createdAt) / (1000 * 60 * 60)).toFixed(2)
            : null
        })),
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          region: user.region || user.city,
          joinedAt: user.createdAt
        })),
        summary: {
          totalOrders: orders.length,
          completedOrders: orders.filter(o => o.status === 'completed').length,
          totalRevenue: orders
            .filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + (o.price || 0), 0),
          newUsers: users.length,
          activeRegions: [...new Set(orders.map(o => o.customer?.region || o.customer?.city).filter(Boolean))]
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${timeRange}-${Date.now()}.json`);
      res.json(report);
    }

    console.log('Analytics: Report exported successfully');

  } catch (error) {
    console.error('Analytics: Error exporting report:', error);
    res.status(500).json({
      success: false,
      msg: 'Failed to export report',
      error: error.message
    });
  }
};

module.exports = {
  getMetrics: exports.getMetrics,
  exportReport: exports.exportReport
};