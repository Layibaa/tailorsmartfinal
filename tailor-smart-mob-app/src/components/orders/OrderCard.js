// ✅ UPDATED: OrderCard.js - Display suit information
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';
import Button from '../ui/Button';

const OrderCard = ({ 
  order, 
  onPress, 
  showActions = false, 
  onAccept, 
  onReject,
  onConfirm,
  userRole
}) => {
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    return colors[status] || colors.gray;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      confirmed: 'Confirmed',
      making: 'In Production',
      payment_done: 'Payment Received',
      completed: 'Completed'
    };
    return statusMap[status] || status;
  };

  const getSuitDescription = (order) => {
    if (order.suitType === '3-piece') {
      return `${order.suitType} Suit (Shalwar, Kameez, Dupatta)`;
    }
    return `${order.suitType} Suit (Shalwar & Kameez)`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.row}>
          <Feather name="package" size={20} color={colors.black} />
          <View style={styles.titleContainer}>
            <Text style={styles.suitType}>{getSuitDescription(order)}</Text>
            {order.suitType === '3-piece' && order.dupattaDetails?.hasPeco && (
              <View style={styles.pecoTag}>
                <Feather name="star" size={12} color={colors.warning} />
                <Text style={styles.pecoText}>with Peco</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order Date:</Text>
          <Text style={styles.detailValue}>{formatDate(order.createdAt)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Styles:</Text>
          <Text style={styles.detailValue}>
            {order.shalwarStyle} shalwar, {order.kameezStyle} kameez
          </Text>
        </View>

        {order.price > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.detailValue}>PKR {order.price}</Text>
          </View>
        )}

        {userRole === 'customer' && order.tailor && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tailor:</Text>
            <Text style={styles.detailValue}>
              {order.tailor.name || 'Unknown Tailor'}
            </Text>
          </View>
        )}

        {userRole === 'tailor' && order.customer && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>
              {order.customer.name || 'Unknown Customer'}
            </Text>
          </View>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          {userRole === 'tailor' && order.status === 'pending' && (
            <>
              <Button 
                title="Accept" 
                onPress={onAccept} 
                small 
                buttonStyle={styles.acceptButton} 
              />
              <Button 
                title="Reject" 
                onPress={onReject} 
                small 
                danger 
                buttonStyle={styles.rejectButton} 
              />
            </>
          )}

          {userRole === 'customer' && order.status === 'accepted' && (
            <Button 
              title="Confirm Order" 
              onPress={onConfirm} 
              small 
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  titleContainer: {
    marginLeft: 8,
    flex: 1
  },
  suitType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4
  },
  pecoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  pecoText: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '500',
    marginLeft: 4
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.gray
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: 12
  },
  details: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  detailLabel: {
    fontSize: 14,
    color: colors.gray,
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
    textTransform: 'capitalize'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8
  },
  acceptButton: {
    backgroundColor: colors.success,
    marginRight: 8
  },
  rejectButton: {
    backgroundColor: colors.error
  }
});

export default OrderCard;