import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import OrderCard from '../../components/OrderCard';
import Loading from '../../components/Loading';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import useApi from '../../hooks/useApi';
import { getAllOrders, updateOrderStatus, cancelOrder } from '../../utils/api';
import colors from '../../utils/colors';

const OrderManagementScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  
  const { data: orders, loading, error, request: fetchOrders } = useApi(getAllOrders);
  const { loading: statusLoading, request: changeStatus } = useApi(updateOrderStatus);
  const { loading: cancelLoading, request: requestCancelOrder } = useApi(cancelOrder);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (orders) {
      filterOrders();
    }
  }, [orders, searchQuery, filterStatus]);

  const loadOrders = async () => {
    await fetchOrders();
  };

  const filterOrders = () => {
    if (!orders) return;
    
    let filtered = [...orders];
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          order.orderNumber.toString().includes(searchTerm) ||
          order.garmentType.toLowerCase().includes(searchTerm) ||
          (order.customer && order.customer.name.toLowerCase().includes(searchTerm))
        );
      });
    }
    
    setFilteredOrders(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetail', { orderId: order._id });
  };

  const handleStatusChange = (order, newStatus) => {
    Alert.alert(
      `Change Status`,
      `Are you sure you want to change this order's status to ${newStatus.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            const result = await changeStatus(order._id, { status: newStatus });
            if (result.success) {
              Alert.alert('Success', `Order status updated successfully`);
              loadOrders();
            } else {
              Alert.alert('Error', result.error || 'Failed to update order status');
            }
          }
        },
      ]
    );
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
      onCancel={() => handleCancelOrder(item)}
      showActions={true}
    />
  );

  const renderStatusFilterButton = (status, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterStatus === status && styles.filterButtonActive,
      ]}
      onPress={() => {
        setFilterStatus(status);
        setIsFilterModalVisible(false);
      }}
    >
      <Text
        style={[
          styles.filterButtonText,
          filterStatus === status && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={isFilterModalVisible}
      onClose={() => setIsFilterModalVisible(false)}
      title="Filter Orders"
    >
      <View style={styles.filterModalContent}>
        <Text style={styles.filterModalLabel}>Filter by Status</Text>
        <View style={styles.filterButtonsContainer}>
          {renderStatusFilterButton('all', 'All Orders')}
          {renderStatusFilterButton('pending', 'Pending')}
          {renderStatusFilterButton('in_progress', 'In Progress')}
          {renderStatusFilterButton('completed', 'Completed')}
          {renderStatusFilterButton('cancelled', 'Cancelled')}
          {renderStatusFilterButton('locked', 'Locked')}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Order Management" 
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}>
            <Feather name="filter" size={20} color={colors.black} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={20} color={colors.gray} style={styles.searchIcon} />
          <TouchableOpacity 
            style={styles.searchTextContainer}
            onPress={() => {/* Open search modal if needed */}}
          >
            <Text style={searchQuery ? styles.searchQueryText : styles.searchPlaceholder}>
              {searchQuery || 'Search orders...'}
            </Text>
          </TouchableOpacity>
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Feather name="x" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        {filterStatus !== 'all' && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              Filtered by: {filterStatus.replace('_', ' ')}
            </Text>
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={() => setFilterStatus('all')}
            >
              <Feather name="x" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

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
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="clipboard" size={64} color={colors.lightGray} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery || filterStatus !== 'all' 
                  ? "Try changing your search or filter"
                  : "No orders available"}
              </Text>
            </View>
          }
        />
      )}
      
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchTextContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.gray,
  },
  searchQueryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.black,
  },
  clearButton: {
    padding: 8,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  activeFilterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  clearFilterButton: {
    marginLeft: 8,
    padding: 4,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  filterModalContent: {
    padding: 16,
  },
  filterModalLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.black,
    marginBottom: 16,
  },
  filterButtonsContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.gray,
    textTransform: 'capitalize',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
});

export default OrderManagementScreen;