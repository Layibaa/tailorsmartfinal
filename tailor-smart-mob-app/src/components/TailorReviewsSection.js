// REPLACE: tailor-smart-mob-app/src/components/TailorReviewsSection.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView
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
      setStats(response.stats || { 
        total: 0, 
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
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

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={16}
          color={i <= rating ? '#FFD700' : colors.lightGray}
          fill={i <= rating ? '#FFD700' : 'none'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderRatingBar = (starCount, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <View style={styles.ratingBarRow}>
        <Text style={styles.ratingBarLabel}>{starCount}★</Text>
        <View style={styles.ratingBarContainer}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.ratingBarCount}>{count}</Text>
      </View>
    );
  };

  const renderReviewImages = (images) => {
    if (!images || images.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.imagesContainer}
      >
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={styles.reviewImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewerInfo}>
          <View style={styles.reviewerAvatar}>
            <Feather name="user" size={20} color={colors.white} />
          </View>
          <View style={styles.reviewerDetails}>
            <Text style={styles.reviewerName}>
              {item.customer?.name || 'Anonymous'}
            </Text>
            <Text style={styles.reviewDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        {renderStars(item.rating)}
      </View>

      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}

      {renderReviewImages(item.images)}

      {item.order?.garmentType && (
        <View style={styles.orderInfo}>
          <Feather name="shopping-bag" size={14} color={colors.gray} />
          <Text style={styles.orderType}>
            Order: {item.order.garmentType}
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="message-square" size={48} color={colors.gray} />
      <Text style={styles.emptyText}>No reviews yet</Text>
      <Text style={styles.emptySubtext}>
        Be the first to review this tailor!
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
          {/* Average Rating Display */}
          <View style={styles.averageRatingSection}>
            <Text style={styles.averageRatingNumber}>
              {stats.averageRating.toFixed(1)}
            </Text>
            {renderStars(Math.round(stats.averageRating))}
            <Text style={styles.reviewCountText}>
              Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {/* Rating Distribution */}
          <View style={styles.distributionSection}>
            {renderRatingBar(5, stats.ratingDistribution[5], stats.total)}
            {renderRatingBar(4, stats.ratingDistribution[4], stats.total)}
            {renderRatingBar(3, stats.ratingDistribution[3], stats.total)}
            {renderRatingBar(2, stats.ratingDistribution[2], stats.total)}
            {renderRatingBar(1, stats.ratingDistribution[1], stats.total)}
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
        scrollEnabled={false}
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
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16
  },
  averageRatingSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + '30'
  },
  averageRatingNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8
  },
  reviewCountText: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 8
  },
  distributionSection: {
    gap: 8
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  ratingBarLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    width: 30
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.white,
    borderRadius: 4,
    overflow: 'hidden'
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4
  },
  ratingBarCount: {
    fontSize: 14,
    color: colors.gray,
    width: 30,
    textAlign: 'right'
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center'
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
    alignItems: 'flex-start',
    marginBottom: 12
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  reviewerDetails: {
    flex: 1
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray
  },
  reviewComment: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12
  },
  imagesContainer: {
    marginVertical: 12,
    marginHorizontal: -4
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginHorizontal: 4
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  },
  orderType: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: 6,
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