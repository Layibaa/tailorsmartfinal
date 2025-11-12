// REPLACE: tailor-smart-mob-app/src/screens/tailor/OrderRequestsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getPendingOrders, updateOrderStatus } from '../../services/api';
import OrderCard from '../../components/orders/OrderCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const OrderRequestsScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);

  // Load pending orders
  const loadOrders = async () => {
    try {
      console.log('📥 Loading pending orders...');
      const response = await getPendingOrders();
      console.log('✅ Loaded orders:', response.orders?.length || 0);
      setOrders(response.orders || []);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      alert('Error: Failed to load order requests');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Reload when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Screen focused, reloading orders');
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

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

  // Handle reject order - SHOW MODAL
  const handleRejectOrder = (orderId) => {
    console.log('\n🚫 =================================');
    console.log('🚫 REJECT ORDER INITIATED');
    console.log('🚫 Order ID:', orderId);
    console.log('🚫 Order ID Type:', typeof orderId);
    console.log('🚫 =================================\n');
    
    console.log('📱 Opening reject confirmation modal...');
    setOrderToReject(orderId);
    setShowRejectModal(true);
  };

  // Cancel rejection
  const cancelRejection = () => {
    console.log('❌ User clicked CANCEL - rejection aborted');
    setShowRejectModal(false);
    setOrderToReject(null);
  };

  // Confirm rejection
  const confirmRejection = () => {
    console.log('✅ User clicked CONFIRM - proceeding with rejection...');
    setShowRejectModal(false);
    performRejection(orderToReject);
  };

  // Separate function to perform the actual rejection
  const performRejection = async (orderId) => {
    console.log('\n⚡ ================================');
    console.log('⚡ PERFORMING REJECTION');
    console.log('⚡ ================================');
    
    setProcessingOrderId(orderId);
    
    try {
      console.log('⏳ Step 1: Starting rejection process...');
      console.log('📦 Order ID to reject:', orderId);
      
      console.log('⏳ Step 2: Calling updateOrderStatus API...');
      console.log('📡 API URL will be: /orders/' + orderId + '/status');
      console.log('📦 API Payload:', JSON.stringify({ status: 'rejected' }, null, 2));
      
      const response = await updateOrderStatus(orderId, { 
        status: 'rejected' 
      });
      
      console.log('⏳ Step 3: API call completed successfully!');
      console.log('\n✅ ================================');
      console.log('✅ REJECTION SUCCESSFUL!');
      console.log('✅ Response:', JSON.stringify(response, null, 2));
      console.log('✅ ================================\n');
      
      console.log('⏳ Step 4: Removing from local state...');
      // Remove from local state immediately
      setOrders(prevOrders => {
        const filtered = prevOrders.filter(order => order._id !== orderId);
        console.log(`📊 Orders before: ${prevOrders.length}, after: ${filtered.length}`);
        return filtered;
      });
      
      console.log('⏳ Step 5: Showing success message...');
      // Show success message using native alert
      alert('Success! Order has been rejected successfully.');
      
      console.log('✅ All steps completed successfully!\n');
      
    } catch (error) {
      console.error('\n❌ ================================');
      console.error('❌ REJECTION FAILED!');
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      
      if (error.response) {
        console.error('❌ Has response - Server error');
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response statusText:', error.response.statusText);
        console.error('❌ Response headers:', error.response.headers);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.error('❌ Has request - No response from server');
        console.error('❌ Request:', error.request);
      } else {
        console.error('❌ Setup error:', error.message);
      }
      
      console.error('❌ Error stack:', error.stack);
      console.error('❌ ================================\n');
      
      // Detailed error message
      let errorMessage = 'Failed to reject order.\n\n';
      
      if (error.response) {
        errorMessage += 'Server Error: ';
        errorMessage += error.response.data?.msg || error.response.data?.message || `HTTP ${error.response.status}`;
      } else if (error.request) {
        errorMessage += 'Network Error: No response from server. Check your connection.';
      } else {
        errorMessage += 'Error: ' + (error.message || 'Unknown error occurred');
      }
      
      alert(errorMessage);
      
      // Reload orders to ensure we're in sync
      console.log('🔄 Reloading orders after error...');
      await loadOrders();
      
    } finally {
      setProcessingOrderId(null);
      setOrderToReject(null);
      console.log('🏁 Rejection process completed (finally block)\n');
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

  // Render order item with loading state
  const renderOrderItem = ({ item }) => {
    const isProcessing = processingOrderId === item._id;
    
    return (
      <View style={styles.orderWrapper}>
        <OrderCard
          order={item}
          onPress={() => handleOrderPress(item._id)}
          userRole="tailor"
          showActions={!isProcessing}
          onAccept={() => handleAcceptOrder(item._id)}
          onReject={() => handleRejectOrder(item._id)}
        />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.black} />
            <Text style={styles.processingText}>Rejecting order...</Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading order requests..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Order Requests</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} pending {orders.length === 1 ? 'request' : 'requests'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Feather 
            name="refresh-cw" 
            size={24} 
            color={refreshing ? colors.gray : colors.black} 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.black]}
          />
        }
      />

      {/* Custom Reject Confirmation Modal */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelRejection}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Feather name="alert-circle" size={48} color={colors.error} />
            </View>
            
            <Text style={styles.modalTitle}>Reject Order?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to reject this order? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={cancelRejection}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.rejectButton]} 
                onPress={confirmRejection}
              >
                <Text style={styles.rejectButtonText}>Reject Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4
  },
  refreshButton: {
    padding: 8
  },
  listContent: {
    padding: 16,
    paddingTop: 16
  },
  orderWrapper: {
    position: 'relative'
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8
  },
  processingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.black,
    fontWeight: '600'
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 12
  },
  modalMessage: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.gray
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  rejectButton: {
    backgroundColor: colors.error
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
  }
});

export default OrderRequestsScreen;