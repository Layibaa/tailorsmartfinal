// tailor-smart-mob-app/src/screens/customer/WriteOrderReviewScreen.js - NEW FILE
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createOrderReview, checkOrderReviewEligibility } from '../../services/api';
import Button from '../../components/ui/Button';
import colors from '../../styles/colors';

const WriteOrderReviewScreen = ({ route, navigation }) => {
  const { orderId, onReviewSubmitted } = route.params;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    checkEligibility();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need permission to access your photos to upload review images.'
      );
    }
  };

  const checkEligibility = async () => {
    try {
      setIsLoading(true);
      const response = await checkOrderReviewEligibility(orderId);
      
      console.log('Eligibility response:', response);
      
      if (!response.eligible) {
        setIsEligible(false);
        setEligibilityReason(response.reason || 'You cannot review this order');
      } else {
        setIsEligible(true);
        setOrderInfo(response.order);
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      
      if (error.response?.data?.msg) {
        setIsEligible(false);
        setEligibilityReason(error.response.data.msg);
      } else {
        Alert.alert('Error', 'Failed to verify review eligibility');
        navigation.goBack();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload up to 3 images');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Comment Too Short', 'Please write at least 10 characters');
      return;
    }

    try {
      setIsSubmitting(true);

      const reviewData = {
        rating,
        comment: comment.trim(),
        images: images
      };

      console.log('Submitting review for order:', orderId, reviewData);
      
      const response = await createOrderReview(orderId, reviewData);
      
      console.log('Review submitted successfully:', response);

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      Alert.alert(
        'Success',
        'Your review has been submitted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating back after review submission');
              navigation.goBack();
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to submit review. Please try again.';
      
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
        
        if (errorMessage.toLowerCase().includes('already reviewed')) {
          setIsEligible(false);
          setEligibilityReason(errorMessage);
          return;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={styles.loadingText}>Checking eligibility...</Text>
      </View>
    );
  }

  if (!isEligible) {
    return (
      <View style={styles.ineligibleContainer}>
        <Feather name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.ineligibleTitle}>Cannot Write Review</Text>
        <Text style={styles.ineligibleText}>{eligibilityReason}</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          buttonStyle={styles.goBackButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Review</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderIcon}>
            <Feather name="package" size={32} color={colors.white} />
          </View>
          <View>
            <Text style={styles.reviewingLabel}>Writing review for order</Text>
            <Text style={styles.orderText}>{orderInfo?.suitType} Suit</Text>
            <Text style={styles.tailorName}>by {orderInfo?.tailor?.name}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
                disabled={isSubmitting}
              >
                <Feather
                  name="star"
                  size={40}
                  color={star <= rating ? '#FFD700' : colors.lightGray}
                  fill={star <= rating ? '#FFD700' : 'none'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Below Average'}
              {rating === 3 && 'Average'}
              {rating === 4 && 'Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        {/* Written Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Share your experience with this order..."
            placeholderTextColor={colors.gray}
            multiline
            numberOfLines={6}
            maxLength={500}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
            editable={!isSubmitting}
          />
          <Text style={styles.characterCount}>
            {comment.length}/500 characters (min 10)
          </Text>
        </View>

        {/* Image Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos (optional)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload up to 3 photos of completed work
          </Text>
          
          <View style={styles.imagesGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  disabled={isSubmitting}
                >
                  <Feather name="x" size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 3 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                disabled={isSubmitting}
              >
                <Feather name="plus" size={32} color={colors.gray} />
                <Text style={styles.addImageText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={isSubmitting ? 'Submitting...' : 'Submit Review'}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            buttonStyle={[
              styles.submitButton,
              (isSubmitting || rating === 0 || comment.trim().length < 10) && styles.submitButtonDisabled
            ]}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  placeholder: {
    width: 24
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray
  },
  ineligibleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.white
  },
  ineligibleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 24,
    marginBottom: 12
  },
  ineligibleText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32
  },
  goBackButton: {
    paddingHorizontal: 32
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.lightGray,
    margin: 16,
    borderRadius: 12
  },
  orderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  reviewingLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4
  },
  orderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black
  },
  tailorName: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 12
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16
  },
  starButton: {
    padding: 4
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginTop: 8
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.black,
    minHeight: 120
  },
  characterCount: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
    marginTop: 8
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  addImageText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 4
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  submitButton: {
    marginTop: 8
  },
  submitButtonDisabled: {
    opacity: 0.5
  }
});

export default WriteOrderReviewScreen;