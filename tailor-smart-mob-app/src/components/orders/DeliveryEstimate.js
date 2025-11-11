// tailor-smart-mob-app/src/components/orders/DeliveryEstimate.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const DeliveryEstimate = ({ order }) => {
  if (!order.estimatedDeliveryDays || !order.expectedCompletionDate) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.warning || '#FFA500';
      case 'low':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'check-circle';
      case 'medium':
        return 'alert-circle';
      case 'low':
        return 'alert-triangle';
      default:
        return 'info';
    }
  };

  const getConfidenceText = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'Reliable estimate';
      case 'medium':
        return 'Moderate workload';
      case 'low':
        return 'High workload';
      default:
        return 'Estimated';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="clock" size={20} color={colors.primary} />
        <Text style={styles.title}>Estimated Delivery</Text>
      </View>

      <View style={styles.estimateContainer}>
        <View style={styles.daysContainer}>
          <Text style={styles.daysNumber}>{order.estimatedDeliveryDays}</Text>
          <Text style={styles.daysLabel}>
            {order.estimatedDeliveryDays === 1 ? 'day' : 'days'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.dateContainer}>
          <Text style={styles.dateLabel}>Expected by</Text>
          <Text style={styles.dateValue}>
            {formatDate(order.expectedCompletionDate)}
          </Text>
        </View>
      </View>

      {order.deliveryConfidence && (
        <View style={styles.confidenceContainer}>
          <Feather
            name={getConfidenceIcon(order.deliveryConfidence)}
            size={16}
            color={getConfidenceColor(order.deliveryConfidence)}
          />
          <Text
            style={[
              styles.confidenceText,
              { color: getConfidenceColor(order.deliveryConfidence) }
            ]}
          >
            {getConfidenceText(order.deliveryConfidence)}
          </Text>
        </View>
      )}

      {/* Progress indicator if order is in progress */}
      {['confirmed', 'making'].includes(order.status) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: order.status === 'making' ? '70%' : '30%',
                  backgroundColor: colors.primary
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {order.status === 'making' ? 'In production' : 'Order confirmed'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 8
  },
  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8
  },
  daysContainer: {
    alignItems: 'center',
    flex: 1
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary
  },
  daysLabel: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray + '40'
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1
  },
  dateLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 4
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center'
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6
  },
  progressContainer: {
    marginTop: 12
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  progressText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 6,
    textAlign: 'center'
  }
});

export default DeliveryEstimate;