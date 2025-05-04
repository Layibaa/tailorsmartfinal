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
import { getPendingOrders, updateOrderStatus } from '../../services/api';
import OrderCard from '../../components/orders/OrderCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';

const OrderRequestsScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load pending orders
  const loadOrders = async () => {
    try {
      const response = await getPendingOrders();
      setOrders(response.orders);
    } catch (error) {
      Alert.alert('Error', 'Failed to load order requests');
      console.error('Error loading order requests:', error);
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

  // Handle accept order
  const handleAcceptOrder = (orderId) => {
    navigation.navigate('OrderDetails', { 
      orderId,
      actionRequired: true
    });
  };

  // Handle reject order
  const handleRejectOrder = async (orderId) => {
    try {
      setIsLoading(true);
      
      // Update order status to 'rejected'
      await updateOrderStatus(orderId, { status: 'rejected' });
  
      // Show success alert
      Alert.alert('Success', 'Order has been rejected');
  
      // Navigate to Order Request screen (after rejection)
      navigation.navigate('TailorTabs', { screen: 'OrderDetailsScreen' });
      
    } catch (error) {
      // Show error alert in case of failure
      Alert.alert('Error', error.response?.data?.msg || 'Failed to reject order');
      console.error('Error rejecting order:', error);
    } finally {
      setIsLoading(false);
    }
  };
  

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={50} color={colors.lightGray} />
      <Text style={styles.emptyText}>No pending order requests</Text>
      <Text style={styles.emptySubtext}>
        New order requests will appear here when customers place them
      </Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order requests..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Requests</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={24} color={colors.black} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item._id)}
            userRole="tailor"
            showActions={true}
            onAccept={() => handleAcceptOrder(item._id)}
            onReject={() => handleRejectOrder(item._id)}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
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
  listContent: {
    padding: 16,
    paddingTop: 16
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

export default OrderRequestsScreen;
