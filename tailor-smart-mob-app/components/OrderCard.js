import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const OrderCard = ({ order, onPress }) => {
  const { orderNumber, status, garmentType, createdAt, price } = order;

  const getStatusColor = () => {
    switch (status) {
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const getGarmentIcon = () => {
    switch (garmentType.toLowerCase()) {
      case 'shirt':
        return 'shirt-outline';
      case 'pants':
        return 'wallet-outline'; // Using wallet as a substitute for pants
      case 'dress':
        return 'woman-outline';
      case 'suit':
        return 'business-outline';
      default:
        return 'cube-outline';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      
      <View style={styles.row}>
        <Ionicons name={getGarmentIcon()} size={18} color={theme.colors.text} />
        <Text style={styles.garmentType}>{garmentType}</Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.date}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textLight} />
          {' '}{formatDate(createdAt)}
        </Text>
        
        {price && (
          <Text style={styles.price}>
            ${typeof price === 'number' ? price.toFixed(2) : price}
          </Text>
        )}
      </View>
      
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={theme.colors.textLight}
        style={styles.chevron} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: theme.colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  garmentType: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: theme.colors.textLight,
  },
  price: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: theme.colors.primary,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
});

export default OrderCard;