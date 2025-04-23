import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Card from './Card';
import colors from '../utils/colors';

const OrderCard = ({ 
  order, 
  onPress, 
  showStatus = true,
  showActions = true,
  onEdit,
  onCancel,
}) => {
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
      default:
        return colors.gray;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditPress = (e) => {
    e.stopPropagation();
    onEdit && onEdit(order);
  };

  const handleCancelPress = (e) => {
    e.stopPropagation();
    onCancel && onCancel(order);
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
        {showStatus && (
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(order.status) }
          ]}>
            <Text style={styles.statusText}>
              {order.status.replace('_', ' ')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Garment</Text>
          <Text style={styles.value}>{order.garmentType}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
        </View>

        {order.deliveryDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Delivery</Text>
            <Text style={styles.value}>{formatDate(order.deliveryDate)}</Text>
          </View>
        )}
      </View>

      {showActions && order.status !== 'completed' && order.status !== 'cancelled' && (
        <View style={styles.actions}>
          {order.status !== 'locked' && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEditPress}>
              <Feather name="edit" size={16} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCancelPress}>
            <Feather name="x" size={16} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.black,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.white,
    textTransform: 'capitalize',
  },
  content: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.gray,
  },
  value: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.black,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    marginLeft: 4,
  },
});

export default OrderCard;
