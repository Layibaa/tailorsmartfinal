import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getDashboardStats } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import { useFocusEffect } from '@react-navigation/native';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key state
  const { logout } = useContext(AuthContext);

  // Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Load dashboard data with cache busting
  const loadDashboardData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    }
    
    try {
      // Add timestamp to bust cache
      const timestamp = new Date().getTime();
      const data = await getDashboardStats(timestamp);
      
      // Debug logs
      console.log("Dashboard data loaded:", data);
      console.log("Customer count:", data.stats.customerCount);
      console.log("Tailor count:", data.stats.tailorCount);
      
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Pull down to refresh.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data load using the refresh key to force updates
  useEffect(() => {
    loadDashboardData(true);
    
    // Set up a more frequent refresh interval (every 15 seconds)
    const refreshInterval = setInterval(() => {
      loadDashboardData(false);
    }, 15000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [refreshKey]); // Depend on refreshKey

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Screen focused - reloading dashboard data");
      forceRefresh(); // Force refresh when screen is focused
      return () => {}; // Clean up function
    }, [])
  );

  // Handle pull-to-refresh
  const onRefresh = () => {
    console.log("Manual refresh triggered");
    setRefreshing(true);
    forceRefresh(); // Force refresh on pull-to-refresh
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Use the logout function from AuthContext
      const result = await logout();
      if (result.success) {
        // After successful logout, navigate to Login
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', result.error || 'Failed to logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An unexpected error occurred during logout');
    }
  };
// Add this function to your AdminDashboard component

const runDiagnostic = async () => {
  try {
    setIsLoading(true);
    const diagnosticData = await getDiagnosticData();
    
    // Display diagnostic data in an alert
    Alert.alert(
      'Diagnostic Results',
      `Total Users: ${diagnosticData.totalUsers}\n` +
      `Customers: ${diagnosticData.customerCount}\n` +
      `Tailors: ${diagnosticData.tailorCount}\n` +
      `Admins: ${diagnosticData.adminCount}\n` +
      `Orders: ${diagnosticData.orderCount}\n\n` +
      `First 3 users:\n` +
      diagnosticData.users.slice(0, 3).map(u => 
        `- ${u.name} (${u.role})`
      ).join('\n')
    );

    // Also refresh dashboard data
    loadDashboardData();
  } catch (error) {
    Alert.alert('Diagnostic Error', error.message);
  } finally {
    setIsLoading(false);
  }
};

// Then add this button to your header
<TouchableOpacity onPress={runDiagnostic} style={styles.diagnosticButton}>
  <Feather name="activity" size={24} color={colors.warning} />
</TouchableOpacity>

  // Add a manual refresh button
  const handleManualRefresh = () => {
    setIsLoading(true);
    forceRefresh();
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
            <Feather name="refresh-cw" size={24} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Feather name="log-out" size={24} color={colors.black} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, styles.customersCard]}>
            <Feather name="users" size={24} color={colors.black} />
            <Text style={styles.statsNumber}>{stats?.customerCount || 0}</Text>
            <Text style={styles.statsLabel}>Customers</Text>
          </View>

          <View style={[styles.statsCard, styles.tailorsCard]}>
            <Feather name="scissors" size={24} color={colors.black} />
            <Text style={styles.statsNumber}>{stats?.tailorCount || 0}</Text>
            <Text style={styles.statsLabel}>Tailors</Text>
          </View>

          <View style={[styles.statsCard, styles.ordersCard]}>
            <Feather name="shopping-bag" size={24} color={colors.black} />
            <Text style={styles.statsNumber}>{stats?.orderCount || 0}</Text>
            <Text style={styles.statsLabel}>Orders</Text>
          </View>
        </View>

        {/* Order Status Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.orderStatusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.pending }]} />
              <Text style={styles.statusLabel}>Pending</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.pending || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.accepted }]} />
              <Text style={styles.statusLabel}>Accepted</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.accepted || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.confirmed }]} />
              <Text style={styles.statusLabel}>Confirmed</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.confirmed || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.making }]} />
              <Text style={styles.statusLabel}>Making</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.making || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.payment_done }]} />
              <Text style={styles.statusLabel}>Payment Done</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.payment_done || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.completed }]} />
              <Text style={styles.statusLabel}>Completed</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.completed || 0}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: colors.rejected }]} />
              <Text style={styles.statusLabel}>Rejected</Text>
              <Text style={styles.statusValue}>{stats?.orderStatusStats.rejected || 0}</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          
          {recentOrders.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Feather name="inbox" size={50} color={colors.lightGray} />
              <Text style={styles.emptyStateText}>No recent orders</Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderGarmentType}>{order.garmentType}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: colors[order.status] }]}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderDetailText}>
                    Customer: {order.customer?.name || 'Unknown'}
                  </Text>
                  <Text style={styles.orderDetailText}>
                    Tailor: {order.tailor?.name || 'Unknown'}
                  </Text>
                  {order.price > 0 && (
                    <Text style={styles.orderDetailText}>
                      Price: ${order.price}
                    </Text>
                  )}
                  <Text style={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black
  },
  headerButtons: {
    flexDirection: 'row',
  },
  refreshButton: {
    padding: 8,
    marginRight: 10
  },
  logoutButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  customersCard: {
    borderTopWidth: 3,
    borderTopColor: colors.info
  },
  tailorsCard: {
    borderTopWidth: 3,
    borderTopColor: colors.warning
  },
  ordersCard: {
    borderTopWidth: 3,
    borderTopColor: colors.success
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: colors.black
  },
  statsLabel: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.black
  },
  orderStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statusItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  statusLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.darkGray
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  emptyStateContainer: {
    ...globalStyles.emptyStateContainer,
    marginVertical: 40
  },
  emptyStateText: {
    ...globalStyles.emptyStateText
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderGarmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    textTransform: 'capitalize'
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray
  },
  orderStatusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12
  },
  orderDetailText: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4
  },
  orderDate: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'right'
  }
});

export default AdminDashboard;