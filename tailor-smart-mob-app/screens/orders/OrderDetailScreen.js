import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Loading from '../../components/Loading';
import useApi from '../../hooks/useApi';
import { getOrderDetails, updateOrderStatus } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import colors from '../../utils/colors';

const OrderDetailScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const isTailor = user?.role === 'tailor' || user?.role === 'admin';
  const { data: order, loading, error, request: fetchOrderDetails } = useApi(getOrderDetails);
  const { loading: statusLoading, request: changeStatus } = useApi(updateOrderStatus);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    await fetchOrderDetails(orderId);
  };

  const handleStatusChange = async (newStatus) => {
    const statusLabels = {
      in_progress: 'In Progress',
      completed: 'Completed',
      locked: 'Locked',
    };

    Alert.alert(
      `Change Status to ${statusLabels[newStatus]}`,
      `Are you sure you want to mark this order as ${statusLabels[newStatus].toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            const result = await changeStatus(orderId, { status: newStatus });
            if (result.success) {
              Alert.alert('Success', `Order status updated to ${statusLabels[newStatus]}`);
              loadOrderDetails();
            } else {
              Alert.alert('Error', result.error || 'Failed to update order status');
            }
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditOrder', { orderId });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return colors.warning;
      case 'in_progress':
        return colors.info;
      case 'completed':
        return colors.success;
      case 'cancelled':
        return colors.error;
      case 'locked':
        return '#696969'; // Dark gray
      default:
        return colors.gray;
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load order details</Text>
          <Button 
            title="Try Again" 
            onPress={loadOrderDetails} 
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Order Details" 
        rightComponent={
          order.status !== 'completed' && order.status !== 'cancelled' && (
            <TouchableOpacity onPress={handleEdit}>
              <Feather name="edit" size={20} color={colors.black} />
            </TouchableOpacity>
          )
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(order.status) }
          ]}>
            <Text style={styles.statusText}>
              {order.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        
        <Card>
          <Text style={styles.sectionTitle}>Garment Details</Text>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Type</Text>
            <Text style={styles.detailValue}>{order.garmentType}</Text>
          </View>
          
          <View style={styles.detail}>
            <Text style={styles.detailLabel}>Created</Text>
            <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
          </View>
          
          {order.deliveryDate && (
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Expected Delivery</Text>
              <Text style={styles.detailValue}>{formatDate(order.deliveryDate)}</Text>
            </View>
          )}
        </Card>
        
        <Card>
          <Text style={styles.sectionTitle}>Measurements</Text>
          
          {order.measurements && Object.entries(order.measurements).map(([key, value]) => (
            <View style={styles.detail} key={key}>
              <Text style={styles.detailLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Text>
              <Text style={styles.detailValue}>{value} cm</Text>
            </View>
          ))}
        </Card>
        
        {order.notes && (
          <Card>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </Card>
        )}
        
        {order.imageUrl && (
          <Card>
            <Text style={styles.sectionTitle}>Reference Image</Text>
            <Image 
              source={{ uri: order.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </Card>
        )}
        
        {isTailor && order.status !== 'completed' && order.status !== 'cancelled' && (
          <Card>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actions}>
              {order.status === 'pending' && (
                <Button
                  title="Start Working"
                  onPress={() => handleStatusChange('in_progress')}
                  loading={statusLoading}
                  style={styles.actionButton}
                />
              )}
              
              {order.status === 'in_progress' && (
                <Button
                  title="Mark as Completed"
                  onPress={() => handleStatusChange('completed')}
                  loading={statusLoading}
                  style={styles.actionButton}
                />
              )}
              
              {(order.status === 'pending' || order.status === 'in_progress') && (
                <Button
                  title="Lock Order"
                  onPress={() => handleStatusChange('locked')}
                  variant="outline"
                  loading={statusLoading}
                  style={styles.actionButton}
                />
              )}
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.black,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.white,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.black,
    marginBottom: 12,
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  detailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
  },
  detailValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.black,
  },
  notesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.black,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
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
});

export default OrderDetailScreen;