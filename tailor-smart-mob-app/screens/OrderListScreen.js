import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import OrderCard from '../components/OrderCard';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchOrders } from '../services/api';
import { AuthContext } from '../services/auth';

const OrderListScreen = ({ navigation }) => {
  const { authState } = useContext(AuthContext);
  const isTailor = authState.user?.role === 'tailor';
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filters = ['All', 'Pending', 'In Progress', 'Completed'];

  const loadOrders = async (filter = activeFilter) => {
    try {
      setLoading(true);
      const statusFilter = filter !== 'All' ? filter : null;
      const data = await fetchOrders(statusFilter);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    loadOrders(filter);
  };

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        activeFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeFilter === filter && styles.activeFilterButtonText
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title={isTailor ? "Job Requests" : "My Orders"}
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
        rightIcon={!isTailor ? "add-circle-outline" : null}
        onRightPress={!isTailor ? () => navigation.navigate('NewOrder') : null}
      />
      
      <View style={styles.filtersContainer}>
        {filters.map(renderFilterButton)}
      </View>
      
      {loading && !refreshing ? (
        <Loading />
      ) : (
        <>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptyText}>
                {isTailor 
                  ? "You don't have any job requests yet."
                  : "You haven't placed any orders yet."}
              </Text>
              
              {!isTailor && (
                <TouchableOpacity
                  style={styles.createOrderButton}
                  onPress={() => navigation.navigate('NewOrder')}
                >
                  <Text style={styles.createOrderText}>Create New Order</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={orders}
              renderItem={({ item }) => (
                <OrderCard
                  order={item}
                  onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
                />
              )}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.ordersList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          )}
        </>
      )}
      
      {!isTailor && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('NewOrder')}
        >
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.lightGray,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  activeFilterButtonText: {
    color: theme.colors.white,
  },
  ordersList: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  createOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  createOrderText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.white,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default OrderListScreen;