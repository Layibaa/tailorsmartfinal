import React, { useState, useEffect, useContext, useRef } from 'react';
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
import { getCustomerOrders } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import OrderCard from '../../components/orders/OrderCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';

const OrderHistoryScreen = ({ navigation, route }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed'
  const initialRender = useRef(true);
  
  const { user } = useContext(AuthContext);

  // Load orders
  const loadOrders = async () => {
    try {
      const response = await getCustomerOrders();
      setOrders(response.orders);
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

  // Check for new order from route params
  useEffect(() => {
    // Skip on initial render
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    // Check if we have a new order param
    if (route.params?.newOrderAdded && route.params?.newOrderData) {
      console.log("New order detected, updating order list");
      
      // Add the new order to the list without making a network request
      setOrders(prevOrders => {
        // Check if order already exists to avoid duplicates
        const orderExists = prevOrders.some(order => 
          order._id === route.params.newOrderData._id
        );

        if (orderExists) {
          return prevOrders;
        } else {
          return [route.params.newOrderData, ...prevOrders];
        }
      });
      
      // Clear the params to prevent duplicate updates on screen focus
      navigation.setParams({ newOrderAdded: undefined, newOrderData: undefined });
      
      // Set active tab to 'active' to show the new order
      setActiveTab('active');
    }
  }, [route.params?.newOrderAdded, route.params?.newOrderData]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Handle order press
  const handleOrderPress = (orderId) => {
    navigation.navigate('OrderDetails', { orderId });
  };

  // Filter orders based on active tab
  const getFilteredOrders = () => {
    if (activeTab === 'all') {
      return orders;
    } else if (activeTab === 'active') {
      return orders.filter(order => 
        ['pending', 'accepted', 'confirmed', 'making', 'payment_done'].includes(order.status)
      );
    } else if (activeTab === 'completed') {
      return orders.filter(order => 
        ['completed', 'rejected'].includes(order.status)
      );
    }
    return orders;
  };

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          All
        </Text>
      </TouchableOpacity>
      
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
      <Feather name="shopping-bag" size={50} color={colors.lightGray} />
      <Text style={styles.emptyText}>No orders found</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'all' 
          ? "You haven't placed any orders yet" 
          : activeTab === 'active'
            ? "You don't have any active orders"
            : "You don't have any completed orders"}
      </Text>
      <TouchableOpacity
        style={styles.findTailorButton}
        onPress={() => navigation.navigate('Tailors')}
      >
        <Text style={styles.findTailorButtonText}>Find a Tailor</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading orders..." />;
  }

  const filteredOrders = getFilteredOrders();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
  <Text style={styles.headerTitle}>My Orders</Text>
  <View style={styles.headerIcons}>
    <TouchableOpacity onPress={onRefresh} style={styles.iconButton}>
      <Feather name="refresh-ccw" size={24} color={colors.black} />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate('Tailors')} style={styles.iconButton}>
      <Feather name="plus" size={24} color={colors.black} />
    </TouchableOpacity>
  </View>
</View>


      {renderTabs()}

      <FlatList
        data={filteredOrders}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => handleOrderPress(item._id)}
            userRole="customer"
            showActions={item.status === 'accepted'}
            onConfirm={() => {
              navigation.navigate('OrderDetails', { 
                orderId: item._id,
                actionRequired: true 
              });
            }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black
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
    fontSize: 14,
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
    marginTop: 8,
    marginBottom: 24
  },
  findTailorButton: {
    backgroundColor: colors.black,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  findTailorButtonText: {
    color: colors.white,
    fontWeight: '600'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconButton: {
    marginLeft: 12
  }
  });
export default OrderHistoryScreen;
