// tailor-smart-mob-app/src/screens/customer/CreateOrderScreen.js
// UPDATED VERSION WITH DELIVERY PREDICTION

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createOrder, getDeliveryPrediction } from '../../services/api';
import Button from '../../components/ui/Button';
import DeliveryPrediction from '../../components/orders/DeliveryPrediction';
import colors from '../../styles/colors';

const CreateOrderScreen = ({ route, navigation }) => {
  const { tailorId, tailorName, measurements: savedMeasurements } = route.params;
  
  const [garmentType, setGarmentType] = useState('');
  const [measurements, setMeasurements] = useState(savedMeasurements || {});
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [customerSketch, setCustomerSketch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✨ NEW: Prediction states
  const [prediction, setPrediction] = useState(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);

  // ✨ NEW: Load prediction when key details are available
  useEffect(() => {
    if (garmentType && Object.keys(measurements).length > 0) {
      loadPrediction();
    }
  }, [garmentType, measurements, referenceImage, customerSketch]);

  // ✨ NEW: Load delivery prediction
  const loadPrediction = async () => {
    try {
      setIsLoadingPrediction(true);
      
      const predictionData = await getDeliveryPrediction({
        tailorId,
        garmentType,
        measurements,
        referenceImage: referenceImage ? true : false,
        customerSketch: customerSketch ? true : false
      });
      
      setPrediction(predictionData.prediction);
      setShowPrediction(true);
    } catch (error) {
      console.error('Error loading prediction:', error);
      // Don't show error to user, just hide prediction
      setShowPrediction(false);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleImagePick = async (type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        
        if (type === 'reference') {
          setReferenceImage(base64Image);
        } else {
          setCustomerSketch(base64Image);
        }
        
        // Reload prediction with new image
        setTimeout(loadPrediction, 500);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!garmentType) {
      Alert.alert('Required', 'Please select a garment type');
      return;
    }

    if (Object.keys(measurements).length === 0) {
      Alert.alert('Required', 'Please add measurements');
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData = {
        tailorId,
        garmentType,
        measurements,
        notes,
        referenceImage,
        customerSketch
      };

      const response = await createOrder(orderData);

      if (response.success) {
        Alert.alert(
          'Success', 
          `Order created successfully!\n\nEstimated delivery: ${prediction?.estimatedDays || 7} days`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('CustomerTabs', {
                  screen: 'Orders',
                  params: { 
                    newOrderAdded: true,
                    newOrderData: response.order 
                  }
                });
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Create order error:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Order</Text>
        <Text style={styles.headerSubtitle}>For: {tailorName}</Text>
      </View>

      {/* Garment Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Garment Type *</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              garmentType === 'shalwar' && styles.typeButtonActive
            ]}
            onPress={() => setGarmentType('shalwar')}
          >
            <Feather 
              name="user" 
              size={24} 
              color={garmentType === 'shalwar' ? colors.white : colors.black} 
            />
            <Text style={[
              styles.typeButtonText,
              garmentType === 'shalwar' && styles.typeButtonTextActive
            ]}>
              Shalwar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              garmentType === 'kameez' && styles.typeButtonActive
            ]}
            onPress={() => setGarmentType('kameez')}
          >
            <Feather 
              name="user" 
              size={24} 
              color={garmentType === 'kameez' ? colors.white : colors.black} 
            />
            <Text style={[
              styles.typeButtonText,
              garmentType === 'kameez' && styles.typeButtonTextActive
            ]}>
              Kameez
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Measurements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Measurements *</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Measurements', {
              onSave: (newMeasurements) => {
                setMeasurements(newMeasurements);
              }
            })}
          >
            <Text style={styles.editButton}>
              {Object.keys(measurements).length > 0 ? 'Edit' : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {Object.keys(measurements).length > 0 ? (
          <View style={styles.measurementsList}>
            {Object.entries(measurements).map(([key, value]) => (
              <View key={key} style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>{key}:</Text>
                <Text style={styles.measurementValue}>{value} cm</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No measurements added</Text>
        )}
      </View>

      {/* Reference Images */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design Reference (Optional)</Text>
        
        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => handleImagePick('reference')}
        >
          <Feather name="image" size={20} color={colors.black} />
          <Text style={styles.imageButtonText}>
            {referenceImage ? 'Change Reference Image' : 'Add Reference Image'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.imageButton}
          onPress={() => handleImagePick('sketch')}
        >
          <Feather name="edit-3" size={20} color={colors.black} />
          <Text style={styles.imageButtonText}>
            {customerSketch ? 'Change Sketch' : 'Add Your Sketch'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✨ NEW: Delivery Prediction */}
      {isLoadingPrediction && (
        <View style={styles.predictionLoading}>
          <ActivityIndicator size="small" color={colors.black} />
          <Text style={styles.predictionLoadingText}>
            Calculating delivery estimate...
          </Text>
        </View>
      )}

      {showPrediction && prediction && !isLoadingPrediction && (
        <View style={styles.section}>
          <DeliveryPrediction
            estimatedDate={prediction.estimatedDate}
            estimatedDays={prediction.estimatedDays}
            confidence={prediction.confidence}
            complexityScore={prediction.complexityScore}
            showDetails={true}
            factors={prediction.factors}
          />
        </View>
      )}

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Any special requirements or notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <Button
          title={isSubmitting ? 'Creating Order...' : 'Create Order'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || !garmentType || Object.keys(measurements).length === 0}
          icon="check"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12
  },
  editButton: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 14
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12
  },
  typeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white
  },
  typeButtonActive: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  typeButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: colors.black
  },
  typeButtonTextActive: {
    color: colors.white
  },
  measurementsList: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12
  },
  measurementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  measurementLabel: {
    fontSize: 14,
    color: colors.darkGray,
    textTransform: 'capitalize'
  },
  measurementValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginBottom: 12
  },
  imageButtonText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.black
  },
  predictionLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  predictionLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.gray
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top'
  },
  submitSection: {
    padding: 16,
    paddingBottom: 32
  }
});

export default CreateOrderScreen;