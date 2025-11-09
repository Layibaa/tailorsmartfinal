// tailor-smart-mob-app/src/components/orders/DeliveryPrediction.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const DeliveryPrediction = ({ 
  estimatedDate, 
  estimatedDays, 
  confidence, 
  complexityScore,
  showDetails = false,
  factors
}) => {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Get confidence color
  const getConfidenceColor = (conf) => {
    switch(conf) {
      case 'high': return colors.success || '#28a745';
      case 'medium': return colors.warning || '#ffc107';
      case 'low': return colors.error || '#dc3545';
      default: return colors.gray;
    }
  };

  // Get confidence icon
  const getConfidenceIcon = (conf) => {
    switch(conf) {
      case 'high': return 'check-circle';
      case 'medium': return 'alert-circle';
      case 'low': return 'info';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Prediction Display */}
      <View style={styles.mainPrediction}>
        <View style={styles.iconContainer}>
          <Feather name="clock" size={24} color={colors.black} />
        </View>
        
        <View style={styles.predictionContent}>
          <Text style={styles.label}>Estimated Delivery</Text>
          <Text style={styles.dateText}>{formatDate(estimatedDate)}</Text>
          <Text style={styles.daysText}>(~{estimatedDays} days from now)</Text>
        </View>
        
        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(confidence) }]}>
          <Feather 
            name={getConfidenceIcon(confidence)} 
            size={14} 
            color={colors.white} 
            style={styles.badgeIcon}
          />
          <Text style={styles.confidenceText}>
            {confidence?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Complexity Indicator */}
      {complexityScore && (
        <View style={styles.complexityContainer}>
          <Text style={styles.complexityLabel}>Order Complexity:</Text>
          <View style={styles.complexityBar}>
            <View 
              style={[
                styles.complexityFill, 
                { 
                  width: `${complexityScore * 10}%`,
                  backgroundColor: complexityScore > 7 ? colors.error : 
                                  complexityScore > 4 ? colors.warning : 
                                  colors.success
                }
              ]} 
            />
          </View>
          <Text style={styles.complexityScore}>{complexityScore}/10</Text>
        </View>
      )}

      {/* Detailed Factors (Optional) */}
      {showDetails && factors && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Prediction Factors</Text>
          
          <View style={styles.factorRow}>
            <Feather name="users" size={16} color={colors.gray} />
            <Text style={styles.factorLabel}>Current Workload:</Text>
            <Text style={styles.factorValue}>{factors.tailorWorkload} orders</Text>
          </View>
          
          <View style={styles.factorRow}>
            <Feather name="trending-up" size={16} color={colors.gray} />
            <Text style={styles.factorLabel}>Avg. Completion:</Text>
            <Text style={styles.factorValue}>{factors.avgCompletionTime} days</Text>
          </View>
          
          <View style={styles.factorRow}>
            <Feather name="target" size={16} color={colors.gray} />
            <Text style={styles.factorLabel}>Historical Accuracy:</Text>
            <Text style={styles.factorValue}>{factors.historicalAccuracy}%</Text>
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Feather name="info" size={12} color={colors.gray} />
        <Text style={styles.disclaimerText}>
          This is an estimate based on current workload and past performance
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  mainPrediction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  predictionContent: {
    flex: 1
  },
  label: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 2
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2
  },
  daysText: {
    fontSize: 12,
    color: colors.darkGray
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeIcon: {
    marginRight: 4
  },
  confidenceText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600'
  },
  complexityContainer: {
    marginBottom: 16
  },
  complexityLabel: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: 6
  },
  complexityBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  complexityFill: {
    height: '100%',
    borderRadius: 4
  },
  complexityScore: {
    fontSize: 11,
    color: colors.darkGray,
    textAlign: 'right'
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 12,
    marginBottom: 12
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  factorLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginLeft: 8,
    flex: 1
  },
  factorValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  disclaimerText: {
    fontSize: 10,
    color: colors.gray,
    marginLeft: 6,
    flex: 1,
    lineHeight: 14
  }
});

export default DeliveryPrediction;