import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchAdminMetrics } from '../services/api';

const AdminDashboardScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching admin metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Admin Dashboard"
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Platform Overview</Text>
        
        <View style={styles.metricsContainer}>
          {/* Users Card */}
          <Card style={styles.metricCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.metricValue}>{metrics?.totalCustomers || 0}</Text>
            <Text style={styles.metricLabel}>Customers</Text>
          </Card>
          
          {/* Tailors Card */}
          <Card style={styles.metricCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <Ionicons name="cut" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={styles.metricValue}>{metrics?.totalTailors || 0}</Text>
            <Text style={styles.metricLabel}>Tailors</Text>
          </Card>
        </View>
        
        <View style={styles.metricsContainer}>
          {/* Orders Card */}
          <Card style={styles.metricCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.info}20` }]}>
              <Ionicons name="document-text" size={24} color={theme.colors.info} />
            </View>
            <Text style={styles.metricValue}>{metrics?.totalOrders || 0}</Text>
            <Text style={styles.metricLabel}>Total Orders</Text>
          </Card>
          
          {/* Active Orders Card */}
          <Card style={styles.metricCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.success}20` }]}>
              <Ionicons name="sync" size={24} color={theme.colors.success} />
            </View>
            <Text style={styles.metricValue}>{metrics?.activeOrders || 0}</Text>
            <Text style={styles.metricLabel}>Active Orders</Text>
          </Card>
        </View>
        
        {/* Order Status Breakdown */}
        <Card style={styles.orderStatusCard}>
          <Text style={styles.cardTitle}>Order Status</Text>
          
          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.warning }]} />
              <Text style={styles.statusLabel}>Pending</Text>
            </View>
            <Text style={styles.statusValue}>{metrics?.ordersByStatus?.pending || 0}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.info }]} />
              <Text style={styles.statusLabel}>In Progress</Text>
            </View>
            <Text style={styles.statusValue}>{metrics?.ordersByStatus?.inProgress || 0}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <View style={styles.statusLabelContainer}>
              <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
              <Text style={styles.statusLabel}>Completed</Text>
            </View>
            <Text style={styles.statusValue}>{metrics?.ordersByStatus?.completed || 0}</Text>
          </View>
        </Card>
        
        {/* Registration Trend */}
        <Card style={styles.trendCard}>
          <Text style={styles.cardTitle}>Registrations this month</Text>
          <View style={styles.trendContainer}>
            <View style={styles.trendItem}>
              <Text style={styles.trendValue}>{metrics?.newCustomersThisMonth || 0}</Text>
              <Text style={styles.trendLabel}>New Customers</Text>
            </View>
            
            <View style={styles.trendDivider} />
            
            <View style={styles.trendItem}>
              <Text style={styles.trendValue}>{metrics?.newTailorsThisMonth || 0}</Text>
              <Text style={styles.trendLabel}>New Tailors</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 0.48,
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 4,
  },
  orderStatusCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
  },
  statusValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  trendCard: {
    marginBottom: 16,
  },
  trendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
  },
  trendLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 4,
  },
  trendDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
});

export default AdminDashboardScreen;