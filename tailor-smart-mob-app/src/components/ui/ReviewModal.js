// ReviewModal.js - Place in tailor-smart-mob-app/src/components/ui/
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from './Button';
import colors from '../../styles/colors';

const ReviewModal = ({ visible, onClose, onSubmit, orderDetails, isLoading }) => {
  const [rating, setRating] = useState(null);
  const [comment, setComment] = useState('');
  const [charCount, setCharCount] = useState(0);

  const handleCommentChange = (text) => {
    if (text.length <= 200) {
      setComment(text);
      setCharCount(text.length);
    }
  };

  const handleSubmit = () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select thumbs up or thumbs down');
      return;
    }

    onSubmit({
      orderId: orderDetails?.orderId,
      rating,
      comment: comment.trim()
    });
  };

  const handleClose = () => {
    setRating(null);
    setComment('');
    setCharCount(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Rate Your Experience</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.gray} />
            </TouchableOpacity>
          </View>

          {/* Order Info */}
          {orderDetails && (
            <View style={styles.orderInfo}>
              <Text style={styles.orderText}>
                How was your experience with this order?
              </Text>
              <Text style={styles.orderDetail}>
                Garment: {orderDetails.garmentType}
              </Text>
            </View>
          )}

          {/* Rating Selection */}
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={[
                  styles.ratingButton,
                  rating === 'positive' && styles.ratingButtonActive,
                  rating === 'positive' && styles.positiveActive
                ]}
                onPress={() => setRating('positive')}
              >
                <Feather
                  name="thumbs-up"
                  size={32}
                  color={rating === 'positive' ? colors.white : colors.success}
                />
                <Text
                  style={[
                    styles.ratingButtonText,
                    rating === 'positive' && styles.ratingButtonTextActive
                  ]}
                >
                  Good
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ratingButton,
                  rating === 'negative' && styles.ratingButtonActive,
                  rating === 'negative' && styles.negativeActive
                ]}
                onPress={() => setRating('negative')}
              >
                <Feather
                  name="thumbs-down"
                  size={32}
                  color={rating === 'negative' ? colors.white : colors.error}
                />
                <Text
                  style={[
                    styles.ratingButtonText,
                    rating === 'negative' && styles.ratingButtonTextActive
                  ]}
                >
                  Bad
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comment Section */}
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>
              Additional Comments (Optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience..."
              value={comment}
              onChangeText={handleCommentChange}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{charCount}/200</Text>
          </View>

          {/* Submit Button */}
          <Button
            title="Submit Review"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!rating || isLoading}
            icon="send"
          />

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  closeButton: {
    padding: 4
  },
  orderInfo: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20
  },
  orderText: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 4
  },
  orderDetail: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    textTransform: 'capitalize'
  },
  ratingContainer: {
    marginBottom: 20
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  ratingButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
    width: '45%'
  },
  ratingButtonActive: {
    borderColor: 'transparent'
  },
  positiveActive: {
    backgroundColor: colors.success
  },
  negativeActive: {
    backgroundColor: colors.error
  },
  ratingButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray
  },
  ratingButtonTextActive: {
    color: colors.white
  },
  commentContainer: {
    marginBottom: 20
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.black,
    minHeight: 100
  },
  charCount: {
    fontSize: 12,
    color: colors.gray,
    textAlign: 'right',
    marginTop: 4
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8
  },
  skipButtonText: {
    fontSize: 14,
    color: colors.gray,
    fontWeight: '500'
  }
});

export default ReviewModal;