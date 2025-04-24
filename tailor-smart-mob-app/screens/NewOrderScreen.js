import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Card from '../components/Card';
import TailorCard from '../components/TailorCard';
import { theme } from '../utils/theme';
import { fetchTailors, createOrder } from '../services/api';

const garmentTypes = [
  { label: 'Shirt', value: 'Shirt', icon: 'shirt-outline' },
  { label: 'Pants', value: 'Pants', icon: 'wallet-outline' },
  { label: 'Dress', value: 'Dress', icon: 'woman-outline' },
  { label: 'Suit', value: 'Suit', icon: 'business-outline' },
  { label: 'Other', value: 'Other', icon: 'cube-outline' }
];

const NewOrderScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [garmentType, setGarmentType] = useState('');
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [availableTailors, setAvailableTailors] = useState([]);
  const [description, setDescription] = useState('');
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    inseam: '',
    sleeve: '',
    shoulder: ''
  });
  const [fabricImage, setFabricImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch available tailors
  useEffect(() => {
    const loadTailors = async () => {
      try {
        const data = await fetchTailors();
        setAvailableTailors(data);
      } catch (error) {
        console.error('Error fetching tailors:', error);
        Alert.alert('Error', 'Failed to load tailors. Please try again.');
      }
    };

    loadTailors();
  }, []);

  // Handle garment type selection
  const handleGarmentSelect = (type) => {
    setGarmentType(type);
  };

  // Handle tailor selection
  const handleTailorSelect = (tailor) => {
    setSelectedTailor(tailor);
  };

  // Handle measurement change
  const handleMeasurementChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle fabric image picker
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setFabricImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  // Validate form based on current step
  const validateStep = () => {
    const newErrors = {};
    
    if (step === 1 && !garmentType) {
      newErrors.garmentType = 'Please select a garment type';
    }
    
    if (step === 2 && !selectedTailor) {
      newErrors.tailor = 'Please select a tailor';
    }
    
    if (step === 3) {
      if (!description.trim()) {
        newErrors.description = 'Please provide a description';
      }
      
      // Check if at least one measurement is provided
      const hasMeasurement = Object.values(measurements).some(m => m.trim() !== '');
      if (!hasMeasurement) {
        newErrors.measurements = 'Please provide at least one measurement';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    
    try {
      const orderData = {
        garmentType,
        tailorId: selectedTailor._id,
        description,
        measurements,
        fabricImage
      };
      
      const order = await createOrder(orderData);
      
      Alert.alert(
        'Order Created',
        'Your order has been successfully created!',
        [{ text: 'OK', onPress: () => navigation.navigate('OrderDetail', { orderId: order._id }) }]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render step 1: Select garment type
  const renderStep1 = () => (
    <>
      <Text style={styles.stepTitle}>Select Garment Type</Text>
      <Text style={styles.stepDescription}>
        Choose the type of garment you want to tailor
      </Text>
      
      <View style={styles.garmentOptionsContainer}>
        {garmentTypes.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.garmentOption,
              garmentType === item.value && styles.garmentOptionSelected
            ]}
            onPress={() => handleGarmentSelect(item.value)}
          >
            <Ionicons
              name={item.icon}
              size={32}
              color={garmentType === item.value ? theme.colors.white : theme.colors.text}
            />
            <Text
              style={[
                styles.garmentOptionText,
                garmentType === item.value && styles.garmentOptionTextSelected
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {errors.garmentType && (
        <Text style={styles.errorText}>{errors.garmentType}</Text>
      )}
      
      <Button
        title="Next"
        onPress={handleNextStep}
        style={styles.nextButton}
      />
    </>
  );

  // Render step 2: Select tailor
  const renderStep2 = () => (
    <>
      <Text style={styles.stepTitle}>Select a Tailor</Text>
      <Text style={styles.stepDescription}>
        Choose a tailor to work on your {garmentType.toLowerCase()}
      </Text>
      
      <ScrollView style={styles.tailorListContainer}>
        {availableTailors.length > 0 ? (
          availableTailors.map(tailor => (
            <Card
              key={tailor._id}
              style={[
                styles.tailorCard,
                selectedTailor?._id === tailor._id && styles.tailorCardSelected
              ]}
              onPress={() => handleTailorSelect(tailor)}
            >
              <TailorCard tailor={tailor} />
              {selectedTailor?._id === tailor._id && (
                <View style={styles.selectedCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                </View>
              )}
            </Card>
          ))
        ) : (
          <View style={styles.emptyTailors}>
            <Text style={styles.emptyText}>No tailors available</Text>
          </View>
        )}
      </ScrollView>
      
      {errors.tailor && (
        <Text style={styles.errorText}>{errors.tailor}</Text>
      )}
      
      <View style={styles.navigationButtons}>
        <Button
          title="Previous"
          onPress={handlePrevStep}
          variant="outline"
          style={styles.navigationButton}
        />
        <Button
          title="Next"
          onPress={handleNextStep}
          style={styles.navigationButton}
        />
      </View>
    </>
  );

  // Render step 3: Enter details
  const renderStep3 = () => (
    <>
      <Text style={styles.stepTitle}>Enter Details</Text>
      <Text style={styles.stepDescription}>
        Provide details and measurements for your {garmentType.toLowerCase()}
      </Text>
      
      <FormInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Describe your requirements..."
        multiline
        error={errors.description}
      />
      
      <Text style={styles.measurementsTitle}>Measurements (in cm)</Text>
      
      {errors.measurements && (
        <Text style={styles.errorText}>{errors.measurements}</Text>
      )}
      
      <View style={styles.measurementsGrid}>
        <FormInput
          label="Chest"
          value={measurements.chest}
          onChangeText={(value) => handleMeasurementChange('chest', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
        
        <FormInput
          label="Waist"
          value={measurements.waist}
          onChangeText={(value) => handleMeasurementChange('waist', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
        
        <FormInput
          label="Hips"
          value={measurements.hips}
          onChangeText={(value) => handleMeasurementChange('hips', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
        
        <FormInput
          label="Inseam"
          value={measurements.inseam}
          onChangeText={(value) => handleMeasurementChange('inseam', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
        
        <FormInput
          label="Sleeve"
          value={measurements.sleeve}
          onChangeText={(value) => handleMeasurementChange('sleeve', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
        
        <FormInput
          label="Shoulder"
          value={measurements.shoulder}
          onChangeText={(value) => handleMeasurementChange('shoulder', value)}
          placeholder="cm"
          keyboardType="decimal-pad"
          style={styles.measurementInput}
        />
      </View>
      
      <Text style={styles.fabricTitle}>Fabric Reference (Optional)</Text>
      
      <TouchableOpacity style={styles.fabricUpload} onPress={handlePickImage}>
        {fabricImage ? (
          <View style={styles.fabricImageContainer}>
            <Image source={{ uri: fabricImage }} style={styles.fabricImage} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setFabricImage(null)}
            >
              <Ionicons name="close-circle" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Ionicons name="image-outline" size={32} color={theme.colors.textLight} />
            <Text style={styles.uploadText}>Tap to upload fabric image</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.navigationButtons}>
        <Button
          title="Previous"
          onPress={handlePrevStep}
          variant="outline"
          style={styles.navigationButton}
        />
        <Button
          title="Create Order"
          onPress={handleSubmit}
          loading={loading}
          style={styles.navigationButton}
        />
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Create New Order"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 3</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    padding: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginBottom: 24,
  },
  garmentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  garmentOption: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  garmentOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  garmentOptionText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  garmentOptionTextSelected: {
    color: theme.colors.white,
  },
  tailorListContainer: {
    maxHeight: 400,
    marginBottom: 16,
  },
  tailorCard: {
    marginBottom: 16,
    position: 'relative',
  },
  tailorCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  selectedCheckmark: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyTailors: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  measurementsTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementInput: {
    width: '48%',
  },
  fabricTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  fabricUpload: {
    width: '100%',
    height: 150,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  fabricImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  fabricImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    flex: 0.48,
  },
  nextButton: {
    marginTop: 16,
  },
  errorText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.error,
    marginTop: -8,
    marginBottom: 16,
  },
});

export default NewOrderScreen;