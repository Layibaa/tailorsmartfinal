import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchOrderDetails, updateOrderStatus, deleteOrder } from '../services/api';
import { AuthContext } from '../services/auth';

const OrderDetailScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const { authState } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const isTailor = authState.user?.role === 'tailor';
  
  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchOrderDetails(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrder(prevOrder => ({
        ...prevOrder,
        status: newStatus
      }));
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await deleteOrder(orderId);
              Alert.alert('Success', 'Order cancelled successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error cancelling order:', error);
              Alert.alert('Error', 'Failed to cancel order');
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleContactPress = () => {
    if (order) {
      const chatPartnerId = isTailor ? order.customer._id : order.tailor._id;
      const chatPartnerName = isTailor ? order.customer.name : order.tailor.name;
      
      navigation.navigate('Chat', {
        userId: chatPartnerId,
        userName: chatPartnerName
      });
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Header
          title="Order Details"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  const getStatusColor = () => {
    switch (order.status) {
      case 'Pending':
        return theme.colors.warning;
      case 'In Progress':
        return theme.colors.info;
      case 'Completed':
        return theme.colors.success;
      default:
        return theme.colors.textLight;
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Order Details"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="chatbubble-outline"
        onRightPress={handleContactPress}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.orderId}>Order #{order.orderNumber}</Text>
            <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Garment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{order.garmentType}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.detailValue}>{order.description}</Text>
          </View>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          {Object.entries(order.measurements || {}).map(([key, value]) => {
            if (value) {
              return (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  <Text style={styles.detailValue}>{value} cm</Text>
                </View>
              );
            }
            return null;
          })}
          
          {(!order.measurements || Object.keys(order.measurements).length === 0) && (
            <Text style={styles.noDataText}>No measurements provided</Text>
          )}
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isTailor ? 'Customer Information' : 'Tailor Information'}
          </Text>
          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {isTailor 
                  ? order.customer?.name?.charAt(0).toUpperCase() 
                  : order.tailor?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {isTailor ? order.customer?.name : order.tailor?.name}
              </Text>
              {isTailor && order.customer?.email && (
                <Text style={styles.profileDetail}>{order.customer.email}</Text>
              )}
              {!isTailor && order.tailor?.shopName && (
                <Text style={styles.profileDetail}>{order.tailor.shopName}</Text>
              )}
              {!isTailor && order.tailor?.location && (
                <Text style={styles.profileDetail}>
                  <Ionicons name="location-outline" size={14} />
                  {' '}{order.tailor.location}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactPress}
          >
            <Ionicons name="chatbubble-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.contactButtonText}>
              Contact {isTailor ? 'Customer' : 'Tailor'}
            </Text>
          </TouchableOpacity>
        </Card>
        
        {order.fabricImage && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Fabric Reference</Text>
            <Image
              source={{ uri: order.fabricImage }}
              style={styles.fabricImage}
              resizeMode="cover"
            />
          </Card>
        )}
        
        {isTailor && order.status !== 'Completed' && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Update Status</Text>
            <View style={styles.statusButtonsContainer}>
              {order.status === 'Pending' && (
                <Button
                  title="Start Working"
                  onPress={() => handleUpdateStatus('In Progress')}
                  loading={updating}
                  style={styles.statusButton}
                />
              )}
              {order.status === 'In Progress' && (
                <Button
                  title="Mark as Completed"
                  onPress={() => handleUpdateStatus('Completed')}
                  loading={updating}
                  style={styles.statusButton}
                />
              )}
            </View>
          </Card>
        )}
        
        {!isTailor && order.status === 'Pending' && (
          <Button
            title="Cancel Order"
            onPress={handleCancelOrder}
            variant="outline"
            loading={updating}
            style={styles.cancelButton}
          />
        )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    color: theme.colors.white,
    fontFamily: 'Poppins-Bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
  },
  fabricImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusButton: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.error,
    marginBottom: 16,
  },
  errorButton: {
    width: 150,
  },
});

export default OrderDetailScreen;
