import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import useApi from '../../hooks/useApi';
import { getOrderDetails, updateOrder } from '../../utils/api';
import colors from '../../utils/colors';

// Predefined garment types
const GARMENT_TYPES = [
  'Shirt',
  'Pants',
  'Dress',
  'Suit',
  'Blouse',
  'Skirt',
  'Jacket',
  'Other',
];

const EditOrderScreen = ({ navigation, route }) => {
  const { orderId } = route.params;
  
  const [garmentType, setGarmentType] = useState('');
  const [customGarmentType, setCustomGarmentType] = useState('');
  const [showCustomType, setShowCustomType] = useState(false);
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    inseam: '',
    shoulder: '',
    sleeve: '',
    neck: '',
  });
  const [notes, setNotes] = useState('');
  const [image, setImage] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const { loading: fetchLoading, request: fetchOrderDetails } = useApi(getOrderDetails);
  const { loading: updateLoading, request: requestUpdateOrder } = useApi(updateOrder);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    setInitialLoading(true);
    const result = await fetchOrderDetails(orderId);
    
    if (result.success && result.data) {
      const order = result.data;
      
      // Check if garment type is in predefined list
      if (GARMENT_TYPES.includes(order.garmentType)) {
        setGarmentType(order.garmentType);
        setShowCustomType(false);
      } else {
        setGarmentType('Other');
        setCustomGarmentType(order.garmentType);
        setShowCustomType(true);
      }
      
      // Fill in measurements
      const orderMeasurements = order.measurements || {};
      const formattedMeasurements = {};
      
      // Format all measurements as strings
      Object.keys(measurements).forEach(key => {
        formattedMeasurements[key] = orderMeasurements[key] ? String(orderMeasurements[key]) : '';
      });
      
      setMeasurements(formattedMeasurements);
      setNotes(order.notes || '');
      
      // Handle image
      if (order.imageUrl) {
        setOriginalImageUrl(order.imageUrl);
      }
    } else {
      Alert.alert('Error', 'Failed to load order details');
      navigation.goBack();
    }
    
    setInitialLoading(false);
  };

  const handleGarmentTypeSelect = (type) => {
    if (type === 'Other') {
      setShowCustomType(true);
      setGarmentType('Other');
    } else {
      setShowCustomType(false);
      setGarmentType(type);
    }
  };

  const handleMeasurementChange = (key, value) => {
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setMeasurements({
        ...measurements,
        [key]: value,
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permission to upload images');
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage({
        uri: result.assets[0].uri,
        base64: result.assets[0].base64
      });
      setOriginalImageUrl(null); // Clear the original image URL since we have a new image
    }
  };

  const removeImage = () => {
    setImage(null);
    setOriginalImageUrl(null);
  };

  const validateForm = () => {
    // Check for garment type
    if (!garmentType) {
      Alert.alert('Error', 'Please select a garment type');
      return false;
    }
    
    // If "Other" is selected, make sure custom type is provided
    if (garmentType === 'Other' && !customGarmentType.trim()) {
      Alert.alert('Error', 'Please specify the custom garment type');
      return false;
    }
    
    // Check if at least one measurement is provided
    const hasMeasurement = Object.values(measurements).some(m => m.trim() !== '');
    if (!hasMeasurement) {
      Alert.alert('Error', 'Please provide at least one measurement');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    const finalGarmentType = garmentType === 'Other' ? customGarmentType : garmentType;
    
    // Convert measurement strings to numbers and filter out empty ones
    const parsedMeasurements = {};
    Object.entries(measurements).forEach(([key, value]) => {
      if (value.trim() !== '') {
        parsedMeasurements[key] = parseFloat(value);
      }
    });
    
    const orderData = {
      garmentType: finalGarmentType,
      measurements: parsedMeasurements,
      notes: notes.trim(),
    };
    
    // Only include image if it's been changed
    if (image) {
      orderData.image = `data:image/jpeg;base64,${image.base64}`;
    } else if (originalImageUrl === null) {
      // If originalImageUrl is null and there's no new image, it means the image was removed
      orderData.removeImage = true;
    }
    
    const result = await requestUpdateOrder(orderId, orderData);
    
    if (result.success) {
      Alert.alert(
        'Success', 
        'Your order was updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to update order');
    }
  };

  if (initialLoading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Order" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Garment Type</Text>
        <View style={styles.garmentTypesContainer}>
          {GARMENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.garmentTypeButton,
                garmentType === type && styles.garmentTypeSelected,
              ]}
              onPress={() => handleGarmentTypeSelect(type)}
            >
              <Text
                style={[
                  styles.garmentTypeText,
                  garmentType === type && styles.garmentTypeTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {showCustomType && (
          <Input
            label="Custom Garment Type"
            value={customGarmentType}
            onChangeText={setCustomGarmentType}
            placeholder="Enter garment type"
          />
        )}
        
        <Text style={styles.sectionTitle}>Measurements (cm)</Text>
        <Text style={styles.sectionSubtitle}>Enter the measurements you have</Text>
        
        <View style={styles.measurementsContainer}>
          <View style={styles.measurementRow}>
            <Input
              label="Chest"
              value={measurements.chest}
              onChangeText={(value) => handleMeasurementChange('chest', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
            <Input
              label="Waist"
              value={measurements.waist}
              onChangeText={(value) => handleMeasurementChange('waist', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
          </View>
          
          <View style={styles.measurementRow}>
            <Input
              label="Hips"
              value={measurements.hips}
              onChangeText={(value) => handleMeasurementChange('hips', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
            <Input
              label="Inseam"
              value={measurements.inseam}
              onChangeText={(value) => handleMeasurementChange('inseam', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
          </View>
          
          <View style={styles.measurementRow}>
            <Input
              label="Shoulder"
              value={measurements.shoulder}
              onChangeText={(value) => handleMeasurementChange('shoulder', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
            <Input
              label="Sleeve"
              value={measurements.sleeve}
              onChangeText={(value) => handleMeasurementChange('sleeve', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
          </View>
          
          <View style={styles.measurementRow}>
            <Input
              label="Neck"
              value={measurements.neck}
              onChangeText={(value) => handleMeasurementChange('neck', value)}
              placeholder="cm"
              keyboardType="numeric"
              style={styles.measurementInput}
            />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Reference Image</Text>
        
        {!image && !originalImageUrl ? (
          <TouchableOpacity 
            style={styles.imagePickerButton} 
            onPress={pickImage}
          >
            <Feather name="image" size={24} color={colors.gray} />
            <Text style={styles.imagePickerText}>Upload a reference image</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: image ? image.uri : originalImageUrl }} 
              style={styles.selectedImage} 
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={removeImage}
            >
              <Feather name="x" size={20} color={colors.white} />
            </TouchableOpacity>
            
            {!image && (
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={pickImage}
              >
                <Feather name="edit-2" size={20} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <Input
          label="Additional Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any special requirements or instructions"
          multiline={true}
          numberOfLines={4}
        />
        
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={updateLoading}
            style={styles.submitButton}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.black,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    marginBottom: 16,
  },
  garmentTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  garmentTypeButton: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  garmentTypeSelected: {
    backgroundColor: colors.primary,
  },
  garmentTypeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.gray,
  },
  garmentTypeTextSelected: {
    color: colors.white,
  },
  measurementsContainer: {
    marginBottom: 16,
  },
  measurementRow: {
    flexDirection: 'row',
  },
  measurementInput: {
    flex: 1,
    marginRight: 8,
  },
  imagePickerButton: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeImageButton: {
    position: 'absolute',
    top: 8,
    right: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    marginVertical: 24,
  },
  submitButton: {
    marginBottom: 12,
  },
});

export default EditOrderScreen;