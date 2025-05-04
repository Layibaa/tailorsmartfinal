import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getActiveOrders, getCompletedOrders } from '../../services/api';
import OrderCard from '../../components/orders/OrderCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';

const ActiveOrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'completed'
  
  // Load orders
  const loadOrders = async () => {
    try {
      const [activeResponse, completedResponse] = await Promise.all([
        getActiveOrders(),
        getCompletedOrders()
      ]);
      
      setOrders(activeResponse.orders);
      setCompletedOrders(completedResponse.orders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load orders');
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Handle order press
  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  // Get current orders based on active tab
  const getCurrentOrders = () => {
    return activeTab === 'active' ? orders : completedOrders;
  };

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
        onPress={() => setActiveTab('active')}
      >
        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
          Active
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
        onPress={() => setActiveTab('completed')}
      >
        <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
          Completed
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather 
        name={activeTab === 'active' ? 'clipboard' : 'check-circle'} 
        size={50} 
        color={colors.lightGray} 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'active' ? 'No active orders' : 'No completed orders'}
      </Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'active' 
          ? 'Orders that are confirmed, in production, or awaiting payment will appear here' 
          : 'Orders that you have completed will appear here'}
      </Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        {/* Add the refresh button here */}
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-ccw" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      <FlatList
        data={getCurrentOrders()}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item._id)}
            userRole="tailor"
            showActions={false}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black
  },
  refreshButton: {
    padding: 8
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.black
  },
  tabText: {
    fontSize: 16,
    color: colors.gray,
    fontWeight: '500'
  },
  activeTabText: {
    color: colors.black,
    fontWeight: '600'
  },
  listContent: {
    padding: 16,
    paddingTop: 0
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8
  }
});

export default ActiveOrdersScreen;
