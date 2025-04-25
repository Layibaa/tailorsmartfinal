import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const TailorCard = ({ tailor, onPress }) => {
  const { shopName, rating, location, priceRange } = tailor;

  // Format rating to display as stars
  const renderRatingStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons 
          key={`star-${i}`} 
          name="star" 
          size={16} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <Ionicons 
          key="half-star" 
          name="star-half" 
          size={16} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    // Add empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons 
          key={`empty-${i}`} 
          name="star-outline" 
          size={16} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.shopName}>{shopName}</Text>
        
        <View style={styles.ratingContainer}>
          {renderRatingStars()}
          <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.infoText}>{location}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.infoText}>{priceRange}</Text>
        </View>
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
    flexDirection: 'row',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  shopName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.textLight,
    marginLeft: 8,
  },
  chevron: {
    alignSelf: 'center',
  },
});

export default TailorCard;
