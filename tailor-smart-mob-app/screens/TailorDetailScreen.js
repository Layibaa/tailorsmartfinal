import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchTailorDetails } from '../services/api';

const TailorDetailScreen = ({ route, navigation }) => {
  const { tailorId } = route.params;
  const [tailor, setTailor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTailorDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchTailorDetails(tailorId);
      setTailor(data);
    } catch (error) {
      console.error('Error fetching tailor details:', error);
      Alert.alert('Error', 'Failed to load tailor details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTailorDetails();
    setRefreshing(false);
  };

  useEffect(() => {
    loadTailorDetails();
  }, [tailorId]);

  const handleCreateOrder = () => {
    navigation.navigate('NewOrder', { selectedTailorId: tailorId });
  };

  const handleChat = () => {
    if (tailor) {
      navigation.navigate('Chat', {
        userId: tailor.user._id,
        userName: tailor.user.name
      });
    }
  };

  // Function to render star rating
  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons 
          key={`star-${i}`} 
          name="star" 
          size={18} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons 
          key="half-star" 
          name="star-half" 
          size={18} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons 
          key={`empty-${i}`} 
          name="star-outline" 
          size={18} 
          color={theme.colors.gold} 
          style={styles.star} 
        />
      );
    }

    return stars;
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  if (!tailor) {
    return (
      <View style={styles.container}>
        <Header
          title="Tailor Details"
          leftIcon="arrow-back"
          onLeftPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tailor not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Tailor Details"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.shopHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {tailor.user?.name?.charAt(0).toUpperCase() || 'T'}
              </Text>
            </View>
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{tailor.shopName}</Text>
              
              <View style={styles.ratingContainer}>
                {renderRatingStars(tailor.rating)}
                <Text style={styles.ratingText}>({tailor.rating.toFixed(1)})</Text>
              </View>
              
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textLight} />
                <Text style={styles.locationText}>{tailor.location}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonGroup}>
            <Button
              title="Create Order"
              onPress={handleCreateOrder}
              style={styles.orderButton}
            />
            <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {tailor.description || `${tailor.shopName} specializes in custom tailoring with a focus on quality craftsmanship and attention to detail.`}
          </Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{tailor.experience || '5+ years'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoLabel}>Price Range</Text>
              <Text style={styles.infoValue}>{tailor.priceRange}</Text>
            </View>
          </View>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {(tailor.specialties || ['Shirts', 'Pants', 'Suits', 'Dresses']).map((specialty, index) => (
              <View key={index} style={styles.specialtyItem}>
                <Ionicons 
                  name={
                    specialty.toLowerCase() === 'shirts' ? 'shirt-outline' :
                    specialty.toLowerCase() === 'pants' ? 'wallet-outline' :
                    specialty.toLowerCase() === 'suits' ? 'business-outline' :
                    specialty.toLowerCase() === 'dresses' ? 'woman-outline' :
                    'cut-outline'
                  } 
                  size={24} 
                  color={theme.colors.primary} 
                />
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        {tailor.featuredWork && tailor.featuredWork.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Work</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredWorkScroll}>
              {tailor.featuredWork.map((item, index) => (
                <View key={index} style={styles.featuredWorkItem}>
                  <Image source={{ uri: item.imageUrl }} style={styles.featuredWorkImage} />
                  <Text style={styles.featuredWorkTitle}>{item.title}</Text>
                </View>
              ))}
            </ScrollView>
          </Card>
        )}
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {(tailor.reviews && tailor.reviews.length > 0) ? (
            tailor.reviews.map((review, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.customerName}</Text>
                  <View style={styles.reviewRating}>
                    {renderRatingStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{new Date(review.date).toLocaleDateString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          )}
        </Card>
        
        <Button
          title="Create Order with this Tailor"
          onPress={handleCreateOrder}
          style={styles.createOrderButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    color: theme.colors.white,
    fontFamily: 'Poppins-Bold',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderButton: {
    flex: 1,
    marginRight: 12,
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 2,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specialtyItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  specialtyText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
  },
  featuredWorkScroll: {
    flexDirection: 'row',
  },
  featuredWorkItem: {
    width: 150,
    marginRight: 12,
  },
  featuredWorkImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  featuredWorkTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
    textAlign: 'center',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  noReviewsText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  createOrderButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.error,
    marginBottom: 16,
  },
  errorButton: {
    width: 150,
  },
});

export default TailorDetailScreen;