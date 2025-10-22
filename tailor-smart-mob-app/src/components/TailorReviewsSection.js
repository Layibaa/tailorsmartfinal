// tailor-smart-mob-app/src/components/TailorReviewsSection.js - COMPLETE CODE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTailorReviews } from '../services/api';
import colors from '../styles/colors';

const TailorReviewsSection = ({ tailorId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tailorId) {
      loadReviews();
    }
  }, [tailorId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await getTailorReviews(tailorId);
      setReviews(response.reviews || []);
      setStats(response.stats || { total: 0, positive: 0, negative: 0 });
    } catch (error) {
      console.error('Load reviews error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <Feather name="user" size={16} color={colors.gray} />
          <Text style={styles.reviewerName}>{item.customer?.name || 'Customer'}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Feather
            name={item.rating === 'positive' ? 'thumbs-up' : 'thumbs-down'}
            size={16}
            color={item.rating === 'positive' ? colors.success : colors.error}
          />
        </View>
      </View>

      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}

      <View style={styles.reviewFooter}>
        <Text style={styles.reviewDate}>{formatDate(item.createdAt)}</Text>
        {item.order?.garmentType && (
          <Text style={styles.orderType}>
            Order: {item.order.garmentType}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="message-square" size={48} color={colors.gray} />
      <Text style={styles.emptyText}>No reviews yet</Text>
      <Text style={styles.emptySubtext}>
        Reviews from customers will appear here
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Reviews</Text>
        {stats && stats.total > 0 && (
          <Text style={styles.totalCount}>({stats.total})</Text>
        )}
      </View>

      {stats && stats.total > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Feather name="thumbs-up" size={20} color={colors.success} />
            <Text style={styles.statNumber}>{stats.positive}</Text>
            <Text style={styles.statLabel}>Positive</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Feather name="thumbs-down" size={20} color={colors.error} />
            <Text style={styles.statNumber}>{stats.negative}</Text>
            <Text style={styles.statLabel}>Negative</Text>
          </View>
        </View>
      )}

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={reviews.length === 0 ? styles.emptyListContainer : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  totalCount: {
    fontSize: 16,
    color: colors.gray,
    marginLeft: 8
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.gray,
    opacity: 0.3
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 8
  },
  ratingBadge: {
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    padding: 8
  },
  reviewComment: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    paddingTop: 8
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray
  },
  orderType: {
    fontSize: 12,
    color: colors.gray,
    textTransform: 'capitalize'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray,
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 8,
    textAlign: 'center'
  }
});

export default TailorReviewsSection;