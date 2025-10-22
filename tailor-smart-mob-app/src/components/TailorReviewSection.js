// Create this as: tailor-smart-mob-app/src/components/TailorReviewsSection.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTailorReviews } from '../services/api';
import colors from '../styles/colors';

const TailorReviewsSection = ({ tailorId }) => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [tailorId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await getTailorReviews(tailorId);
      setReviews(response.reviews || []);
      setAverageRating(response.averageRating || 0);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Feather
          key={i}
          name={i <= rating ? "star" : "star"}
          size={16}
          color={i <= rating ? "#FFD700" : colors.lightGray}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
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
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {renderStars(item.rating)}
      </View>
      {item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={48} color={colors.lightGray} />
      <Text style={styles.emptyText}>No reviews yet</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
        {reviews.length > 0 && (
          <View style={styles.averageRating}>
            <Feather name="star" size={20} color="#FFD700" />
            <Text style={styles.averageRatingText}>
              {averageRating.toFixed(1)}
            </Text>
            <Text style={styles.reviewCount}>
              ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyState}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8
  },
  header: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 8
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  averageRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 4
  },
  reviewCount: {
    fontSize: 14,
    color: colors.gray,
    marginLeft: 4
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  listContent: {
    paddingBottom: 16
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: colors.black
  },
  reviewDate: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2
  },
  starsContainer: {
    flexDirection: 'row'
  },
  reviewComment: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 12
  }
});

export default TailorReviewsSection;