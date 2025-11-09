// tailor-smart-mob-app/src/components/tailors/TailorDeliveryStats.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const TailorDeliveryStats = ({ stats }) => {
  if (!stats || stats.totalOrders === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No delivery statistics available yet</Text>
      </View>
    );
  }

  // Get performance rating
  const getPerformanceRating = (accuracy) => {
    if (accuracy >= 90) return { label: 'Excellent', color: colors.success || '#28a745' };
    if (accuracy >= 75) return { label: 'Good', color: colors.info || '#17a2b8' };
    if (accuracy >= 60) return { label: 'Fair', color: colors.warning || '#ffc107' };
    return { label: 'Needs Improvement', color: colors.error || '#dc3545' };
  };

  const performance = getPerformanceRating(stats.avgAccuracy);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Delivery Performance</Text>
      
      {/* Performance Rating */}
      <View style={styles.performanceCard}>
        <View style={[styles.performanceBadge, { backgroundColor: performance.color }]}>
          <Feather name="award" size={24} color={colors.white} />
        </View>
        <View style={styles.performanceContent}>
          <Text style={styles.performanceLabel}>{performance.label}</Text>
          <Text style={styles.performanceSubtext}>Based on past deliveries</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {/* Total Orders */}
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.info + '20' }]}>
            <Feather name="package" size={20} color={colors.info || '#17a2b8'} />
          </View>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        {/* On-Time Percentage */}
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
            <Feather name="check-circle" size={20} color={colors.success || '#28a745'} />
          </View>
          <Text style={styles.statValue}>{stats.onTimePercentage}%</Text>
          <Text style={styles.statLabel}>On-Time</Text>
        </View>

        {/* Average Accuracy */}
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: performance.color + '20' }]}>
            <Feather name="target" size={20} color={performance.color} />
          </View>
          <Text style={styles.statValue}>{stats.avgAccuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>

        {/* Average Completion Time */}
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: colors.warning + '20' }]}>
            <Feather name="clock" size={20} color={colors.warning || '#ffc107'} />
          </View>
          <Text style={styles.statValue}>{stats.avgCompletionTime}</Text>
          <Text style={styles.statLabel}>Avg. Days</Text>
        </View>
      </View>

      {/* Progress Bars */}
      <View style={styles.progressSection}>
        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Delivery Accuracy</Text>
            <Text style={styles.progressValue}>{stats.avgAccuracy}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${stats.avgAccuracy}%`,
                  backgroundColor: performance.color
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.progressItem}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>On-Time Deliveries</Text>
            <Text style={styles.progressValue}>{stats.onTimePercentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${stats.onTimePercentage}%`,
                  backgroundColor: colors.success || '#28a745'
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoNote}>
        <Feather name="info" size={14} color={colors.info || '#17a2b8'} />
        <Text style={styles.infoText}>
          Statistics based on the last {stats.totalOrders} completed orders
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
    marginVertical: 8
  },
  noDataText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16
  },
  performanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  performanceBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  performanceContent: {
    flex: 1
  },
  performanceLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2
  },
  performanceSubtext: {
    fontSize: 12,
    color: colors.gray
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16
  },
  statCard: {
    width: '50%',
    padding: 4
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 2
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray
  },
  progressSection: {
    marginBottom: 16
  },
  progressItem: {
    marginBottom: 16
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  progressLabel: {
    fontSize: 12,
    color: colors.darkGray,
    fontWeight: '500'
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: (colors.info || '#17a2b8') + '10',
    padding: 12,
    borderRadius: 8
  },
  infoText: {
    fontSize: 11,
    color: colors.darkGray,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  }
});

export default TailorDeliveryStats;