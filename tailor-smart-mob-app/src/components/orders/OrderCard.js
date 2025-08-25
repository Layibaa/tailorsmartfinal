import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const OrderCard = ({ 
  order, 
  onPress, 
  userRole, 
  showActions = false, 
  onConfirm 
}) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status label
  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending Approval',
      accepted: 'Accepted',
      rejected: 'Rejected',
      confirmed: 'Confirmed',
      making: 'In Production',
      payment_done: 'Payment Received',
      completed: 'Completed'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      pending: colors.warning,
      accepted: colors.info,
      rejected: colors.error,
      confirmed: colors.success,
      making: colors.primary,
      payment_done: colors.success,
      completed: colors.success
    };
    return colorMap[status] || colors.gray;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* Card Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderIdText}>
            Order #{order._id.substring(0, 8)}
          </Text>
          <Text style={styles.dateText}>
            {formatDate(order.createdAt)}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
          </View>
          
          {/* Lock Status - Show for both roles but with different styling */}
          <View style={styles.lockIndicator}>
            <Feather 
              name={order.isLocked ? "lock" : "unlock"} 
              size={14} 
              color={order.isLocked ? colors.error : colors.success} 
            />
            {userRole === 'tailor' && (
              <Text style={[styles.lockStatusText, { 
                color: order.isLocked ? colors.error : colors.warning 
              }]}>
                {order.isLocked ? 'Locked' : 'Can Edit'}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Garment:</Text>
          <Text style={styles.value}>{order.garmentType}</Text>
        </View>
        
        {order.price > 0 && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.priceValue}>PKR {order.price}</Text>
          </View>
        )}
        
        {userRole === 'customer' && order.tailor && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tailor:</Text>
            <Text style={styles.value}>{order.tailor.name}</Text>
          </View>
        )}
        
        {userRole === 'tailor' && order.customer && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Customer:</Text>
            <Text style={styles.value}>{order.customer.name}</Text>
          </View>
        )}

        {/* Show lock status info for customer */}
        {userRole === 'customer' && !order.isLocked && ['pending', 'accepted'].includes(order.status) && (
          <View style={styles.editableNotice}>
            <Feather name="edit-3" size={12} color={colors.info} />
            <Text style={styles.editableNoticeText}>Can be edited</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      {showActions && order.status === 'accepted' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Text style={styles.confirmButtonText}>Confirm Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card Footer with additional info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap to view details
        </Text>
        <Feather name="chevron-right" size={16} color={colors.gray} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4
  },
  dateText: {
    fontSize: 12,
    color: colors.gray
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6
  },
  statusText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 11
  },
  lockIndicator: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  lockStatusText: {
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4
  },
  content: {
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  label: {
    fontSize: 14,
    color: colors.gray,
    flex: 1
  },
  value: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    textTransform: 'capitalize'
  },
  priceValue: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right'
  },
  editableNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  editableNoticeText: {
    fontSize: 12,
    color: colors.info,
    marginLeft: 4,
    fontWeight: '500'
  },
  actionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  confirmButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  footerText: {
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic'
  }
});

export default OrderCard;