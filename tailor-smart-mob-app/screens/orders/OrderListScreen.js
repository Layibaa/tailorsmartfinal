import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import OrderCard from '../../components/OrderCard';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import useApi from '../../hooks/useApi';
import { getOrders, cancelOrder } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import colors from '../../utils/colors';

const OrderListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const { data: orders, loading, error, request: fetchOrders } = useApi(getOrders);
  const { loading: cancelLoading, request: requestCancelOrder } = useApi(cancelOrder);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    
    // Set up a refresh timer (for demo/testing purposes)
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing orders list...');
      loadOrders();
    }, 30000); // refresh every 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const loadOrders = async () => {
    console.log(`Loading orders for ${user?.role}...`);
    try {
      const result = await fetchOrders();
      console.log(`Loaded ${result.data?.length || 0} orders`);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order._id });
  };

  const handleEditOrder = (order) => {
    navigation.navigate('EditOrder', { orderId: order._id });
  };

  const handleCancelOrder = async (order) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            const result = await requestCancelOrder(order._id);
            if (result.success) {
              Alert.alert('Success', 'Order cancelled successfully');
              loadOrders();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel order');
            }
          }
        },
      ]
    );
  };

  const renderOrderItem = ({ item }) => (
    <OrderCard
      order={item}
      onPress={() => handleOrderPress(item)}
      onEdit={() => handleEditOrder(item)}
      onCancel={() => handleCancelOrder(item)}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Feather name="clipboard" size={64} color={colors.lightGray} />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        {isCustomer 
          ? "You haven't placed any orders yet" 
          : "You don't have any orders to handle yet"}
      </Text>
      {isCustomer && (
        <Button
          title="Create New Order"
          onPress={() => navigation.navigate('NewOrder')}
          style={styles.newOrderButton}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Orders" 
        showBack={false}
        rightComponent={
          isCustomer ? (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('NewOrder')}
            >
              <Feather name="plus" size={24} color={colors.black} />
            </TouchableOpacity>
          ) : null
        }
      />

      {loading && !refreshing ? (
        <Loading />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load orders</Text>
          <Button 
            title="Try Again" 
            onPress={loadOrders} 
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  newOrderButton: {
    width: '100%',
    maxWidth: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OrderListScreen;
