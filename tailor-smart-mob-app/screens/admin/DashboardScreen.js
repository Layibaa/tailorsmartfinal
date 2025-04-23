import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import useApi from '../../hooks/useApi';
import { getDashboardStats } from '../../utils/api';
import colors from '../../utils/colors';

const DashboardScreen = () => {
  const { data, loading, error, request: fetchStats } = useApi(getDashboardStats);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    await fetchStats();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardStats();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  // Default values in case data is not available
  const stats = data || {
    userStats: { total: 0, customers: 0, tailors: 0 },
    orderStats: { total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0 },
    recentActivity: []
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Dashboard" showBack={false} />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load dashboard data</Text>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>User Statistics</Text>
        <View style={styles.statCardsContainer}>
          <StatCard 
            title="Total Users"
            value={stats.userStats.total}
            icon="users"
            color="#6B7FD7"
          />
          <StatCard 
            title="Customers"
            value={stats.userStats.customers}
            icon="user"
            color="#5DADE2"
          />
          <StatCard 
            title="Tailors"
            value={stats.userStats.tailors}
            icon="scissors"
            color="#D4AF37"
          />
        </View>
        
        <Text style={styles.sectionTitle}>Order Statistics</Text>
        <View style={styles.statCardsContainer}>
          <StatCard 
            title="Total Orders"
            value={stats.orderStats.total}
            icon="clipboard"
            color="#6B7FD7"
          />
          <StatCard 
            title="Pending"
            value={stats.orderStats.pending}
            icon="clock"
            color="#F39C12"
          />
          <StatCard 
            title="In Progress"
            value={stats.orderStats.inProgress}
            icon="tool"
            color="#3498DB"
          />
          <StatCard 
            title="Completed"
            value={stats.orderStats.completed}
            icon="check-circle"
            color="#2ECC71"
          />
          <StatCard 
            title="Cancelled"
            value={stats.orderStats.cancelled}
            icon="x-circle"
            color="#E74C3C"
          />
        </View>
        
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <Feather 
                    name={getActivityIcon(activity.type)} 
                    size={16} 
                    color={colors.white} 
                    style={[
                      styles.activityIcon,
                      { backgroundColor: getActivityColor(activity.type) }
                    ]}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{formatActivityTime(activity.time)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for stat cards
const StatCard = ({ title, value, icon, color }) => (
  <Card style={styles.statCard}>
    <View style={styles.statCardContent}>
      <View style={[styles.statIconContainer, { backgroundColor: color }]}>
        <Feather name={icon} size={20} color={colors.white} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  </Card>
);

// Helper functions
const getActivityIcon = (type) => {
  switch (type) {
    case 'new_order':
      return 'plus-circle';
    case 'update_order':
      return 'edit';
    case 'cancel_order':
      return 'x-circle';
    case 'complete_order':
      return 'check-circle';
    case 'new_user':
      return 'user-plus';
    default:
      return 'activity';
  }
};

const getActivityColor = (type) => {
  switch (type) {
    case 'new_order':
      return '#3498DB';
    case 'update_order':
      return '#F39C12';
    case 'cancel_order':
      return '#E74C3C';
    case 'complete_order':
      return '#2ECC71';
    case 'new_user':
      return '#9B59B6';
    default:
      return '#95A5A6';
  }
};

const formatActivityTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else {
    return `${diffDays} days ago`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.error,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.black,
    marginBottom: 12,
    marginTop: 8,
  },
  statCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    marginRight: '4%',
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    marginRight: '4%',
  },
  statCardContent: {
    alignItems: 'center',
    padding: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.black,
    marginBottom: 4,
  },
  statTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  activityIconContainer: {
    marginRight: 12,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: 32,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.black,
    marginBottom: 4,
  },
  activityTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.gray,
  },
  noActivityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    padding: 16,
  },
});

export default DashboardScreen;