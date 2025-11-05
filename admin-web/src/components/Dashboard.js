// admin-web/src/components/Dashboard.js - Fixed version
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { admin } from '../services/api';

const KPICard = ({ title, value, icon, color = 'bg-blue-500', change, loading = false }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <div className={`${color} rounded-full p-3 mr-4`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {loading ? (
          <div className="h-8 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
        {change !== undefined && !loading && (
          <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change} this week
          </p>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Dashboard: Loading stats...');
      const response = await admin.getDashboard();
      console.log('Dashboard: Raw response:', response);
      
      if (response.data && response.data.success && response.data.stats) {
        const receivedStats = response.data.stats;
        console.log('Dashboard: Received stats:', receivedStats);
        
        // Validate and set stats with fallbacks
        setStats({
          customerCount: receivedStats.customerCount || 0,
          tailorCount: receivedStats.tailorCount || 0,
          orderCount: receivedStats.orderCount || 0,
          orderStatusStats: receivedStats.orderStatusStats || {
            pending: 0,
            accepted: 0,
            rejected: 0,
            confirmed: 0,
            making: 0,
            payment_done: 0,
            completed: 0
          },
          weeklyOrders: receivedStats.weeklyOrders || 0,
          weeklyUsers: receivedStats.weeklyUsers || 0,
          totalRevenue: receivedStats.totalRevenue || 0,
          avgOrderValue: receivedStats.avgOrderValue || 0,
          completedOrders: receivedStats.completedOrders || 0
        });
        
        setLastUpdated(new Date());
        console.log('Dashboard: Stats loaded successfully');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Dashboard: Error loading stats:', error);
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      
      // Set empty stats on error
      setStats({
        customerCount: 0,
        tailorCount: 0,
        orderCount: 0,
        orderStatusStats: {
          pending: 0,
          accepted: 0,
          rejected: 0,
          confirmed: 0,
          making: 0,
          payment_done: 0,
          completed: 0
        },
        weeklyOrders: 0,
        weeklyUsers: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        completedOrders: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data with proper validation
  const orderStatusData = stats?.orderStatusStats 
    ? Object.entries(stats.orderStatusStats)
        .filter(([status, count]) => count > 0)
        .map(([status, count]) => ({
          name: status.replace(/_/g, ' ').toUpperCase(),
          value: count,
          color: getStatusColor(status)
        }))
    : [];

  const userRoleData = [
    { 
      name: 'Customers', 
      value: stats?.customerCount || 0, 
      color: '#3b82f6' 
    },
    { 
      name: 'Tailors', 
      value: stats?.tailorCount || 0, 
      color: '#f59e0b' 
    }
  ].filter(item => item.value > 0);

  function getStatusColor(status) {
    const colors = {
      pending: '#fbbf24',
      accepted: '#34d399',
      confirmed: '#60a5fa',
      making: '#a78bfa',
      payment_done: '#fb7185',
      completed: '#10b981',
      rejected: '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  // Calculate completion rate
  const completionRate = stats?.orderCount > 0 
    ? Math.round((stats.completedOrders / stats.orderCount) * 100) 
    : 0;

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of your tailoring platform</p>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Customers"
          value={stats?.customerCount}
          change={stats?.weeklyUsers}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          }
          color="bg-blue-500"
          loading={loading}
        />
        
        <KPICard
          title="Total Tailors"
          value={stats?.tailorCount}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v1" />
            </svg>
          }
          color="bg-amber-500"
          loading={loading}
        />
        
        <KPICard
          title="Total Orders"
          value={stats?.orderCount}
          change={stats?.weeklyOrders}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          color="bg-green-500"
          loading={loading}
        />

        <KPICard
          title="Total Revenue"
          value={stats?.totalRevenue ? `PKR ${stats.totalRevenue.toLocaleString()}` : 'PKR 0'}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          color="bg-purple-500"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : orderStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No order data available
            </div>
          )}
        </div>

        {/* User Roles Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Users by Role</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : userRoleData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userRoleData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No user data available
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Order Completion</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats?.completedOrders || 0}
              </p>
              <p className="text-sm text-gray-500">Completed Orders</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {completionRate}%
              </p>
              <p className="text-sm text-gray-500">Success Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Average Order Value</h3>
          <p className="text-2xl font-bold text-blue-600">
            PKR {stats?.avgOrderValue?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500">Per completed order</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Weekly Growth</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">New Users:</span>
              <span className="font-semibold">{stats?.weeklyUsers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">New Orders:</span>
              <span className="font-semibold">{stats?.weeklyOrders || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status info */}
      <div className="mt-6 text-sm text-gray-500 text-center">
        {loading 
          ? 'Loading...' 
          : `Data refreshes automatically every 30 seconds • ${(stats?.customerCount || 0) + (stats?.tailorCount || 0)} total users • ${stats?.orderCount || 0} total orders`
        }
      </div>
    </div>
  );
};

export default Dashboard;