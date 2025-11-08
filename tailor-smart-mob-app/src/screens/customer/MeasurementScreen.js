// ✅ FIXED: MeasurementScreen.js - IMAGE UPLOAD FIX
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { 
  MeasurementsSchema, 
  getRequiredMeasurementsForGarment,
  measurementLabels
} from '../../utils/validation'; 
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import colors from '../../styles/colors';
import { createOrder } from '../../services/api';
import { EventRegister } from 'react-native-event-listeners';
import DrawingCanvas from '../../components/ui/DrawingCanvas';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MeasurementScreen = ({ route, navigation }) => {
  const { tailorId, tailorName, garmentType, notes } = route.params;
  const [loading, setLoading] = useState(false);
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);
  const [formikRef, setFormikRef] = useState(null);

  // Image & Canvas States
  const [referenceImage, setReferenceImage] = useState(null);
  const [customerSketch, setCustomerSketch] = useState(null);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);

  useEffect(() => {
    const measurements = getRequiredMeasurementsForGarment(garmentType);
    setRequiredMeasurements(measurements);
    requestPermissions();
  }, [garmentType]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to upload images.');
    }
  };

  // ✅ COMPLETELY FIXED IMAGE PICKER
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Reduced quality to prevent size issues
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check if base64 exists
        if (!asset.base64) {
          Alert.alert('Error', 'Failed to process image. Please try again.');
          return;
        }

        // Check file size (approximate)
        const sizeInMB = (asset.base64.length * 0.75) / (1024 * 1024);
        console.log('📊 Image size:', sizeInMB.toFixed(2), 'MB');
        
        if (sizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        // ✅ FIX: Properly format base64 string
        // Remove any existing data:image prefix to avoid duplication
        let base64Data = asset.base64;
        if (base64Data.startsWith('data:')) {
          // Extract just the base64 part after the comma
          base64Data = base64Data.split(',')[1] || base64Data;
        }

        // Now create proper format
        const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${base64Data}`;
        
        console.log('✅ Image formatted:', {
          mimeType,
          prefix: base64Image.substring(0, 50),
          size: base64Image.length
        });

        setReferenceImage({
          uri: asset.uri,
          base64: base64Image
        });
        
        Alert.alert('Success', 'Reference image added successfully!');
      }
    } catch (error) {
      console.error('❌ Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const openCanvas = () => {
    setIsCanvasVisible(true);
  };

  const handleCanvasSave = (signature) => {
    console.log('✅ Canvas signature saved:', signature.substring(0, 50));
    setCustomerSketch(signature);
    setIsCanvasVisible(false);
    Alert.alert('Success', 'Your sketch has been saved!');
  };

  const clearReferenceImage = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this reference image?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setReferenceImage(null)
        }
      ]
    );
  };

  const clearSketch = () => {
    Alert.alert(
      'Remove Sketch',
      'Are you sure you want to remove your sketch?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setCustomerSketch(null)
        }
      ]
    );
  };

  const initialValues = {
    chest: '',
    waist: '',
    hip: '',
    shoulder: '',
    sleeveLength: '',
    neck: '',
    inseam: '',
    outseam: '',
    thigh: ''
  };

  const handleSubmit = async (values) => {
    console.log("📝 handleSubmit called");
    
    // Validate measurements
    const missingMeasurements = requiredMeasurements.filter(
      key => !values[key] || values[key] === ''
    );
    
    if (missingMeasurements.length > 0) {
      console.log("⚠️ Missing required measurements:", missingMeasurements);
      Alert.alert(
        "Missing Measurements",
        `Please enter values for: ${missingMeasurements.map(m => measurementLabels[m] || m).join(', ')}`
      );
      return;
    }
    
    setLoading(true);
    
    // Process measurements
    const measurements = {};
    requiredMeasurements.forEach(key => {
      if (values[key]) {
        measurements[key] = parseFloat(values[key]);
      }
    });
    
    console.log("📏 Processed measurements:", measurements);

    try {
      // ✅ FIX: Create order data with proper image handling
      const orderData = {
        tailorId,
        garmentType,
        measurements,
        notes: notes || ''
      };

      // Only add images if they exist
      if (referenceImage?.base64) {
        console.log('📸 Adding reference image');
        orderData.referenceImage = referenceImage.base64;
      }
      
      if (customerSketch) {
        console.log('✏️ Adding customer sketch');
        orderData.customerSketch = customerSketch;
      }
      
      console.log("📤 Sending order data:", {
        tailorId: orderData.tailorId,
        garmentType: orderData.garmentType,
        measurementCount: Object.keys(orderData.measurements).length,
        hasReferenceImage: !!orderData.referenceImage,
        hasCustomerSketch: !!orderData.customerSketch,
        referenceImagePrefix: orderData.referenceImage?.substring(0, 30),
        customerSketchPrefix: orderData.customerSketch?.substring(0, 30)
      });
      
      const response = await createOrder(orderData);
      
      console.log("✅ Order created successfully:", response);
      
      EventRegister.emit('newOrderCreated', response.order);
  
      Alert.alert(
        'Success',
        'Your order has been sent to the tailor for review.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.navigate('CustomerTabs', {
                screen: 'Orders'
              });
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error creating order:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.msg || 
                          error.message || 
                          'Failed to create order. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Enter Measurements</Text>
        <Text style={styles.headerSubtitle}>
          For {garmentType} • Tailor: {tailorName}
        </Text>
      </View>

      {/* Design Reference Section */}
      <View style={styles.designReferenceContainer}>
        <View style={styles.sectionHeader}>
          <Feather name="image" size={20} color={colors.black} />
          <Text style={styles.sectionTitle}>Design Reference (Optional)</Text>
        </View>
        <Text style={styles.sectionDescription}>
          Upload a reference image or draw a sketch to help the tailor understand your design
        </Text>

        {/* Reference Image */}
        <View style={styles.imageOptionContainer}>
          <Text style={styles.imageOptionTitle}>Reference Image</Text>
          {referenceImage ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: referenceImage.uri }} 
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={clearReferenceImage}
              >
                <Feather name="x" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={pickImage}
            >
              <Feather name="upload" size={20} color={colors.primary} />
              <Text style={styles.uploadButtonText}>Upload Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Customer Sketch */}
        <View style={styles.imageOptionContainer}>
          <Text style={styles.imageOptionTitle}>Draw Your Design</Text>
          {customerSketch ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: customerSketch }} 
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={clearSketch}
              >
                <Feather name="x" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={openCanvas}
            >
              <Feather name="edit-3" size={20} color={colors.primary} />
              <Text style={styles.uploadButtonText}>Draw Sketch</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.measurementGuideContainer}>
        <View style={styles.measurementGuideHeader}>
          <Feather name="info" size={20} color={colors.black} />
          <Text style={styles.measurementGuideTitle}>Measurement Guide</Text>
        </View>
        <Text style={styles.measurementGuideText}>
          Please provide accurate measurements in centimeters. All fields are required.
        </Text>
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={MeasurementsSchema[garmentType]}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched, setFieldValue }) => {
          if (!formikRef) {
            setFormikRef({ setFieldValue });
          }

          return (
            <View style={styles.formContainer}>
              {requiredMeasurements.map((measurement) => (
                <Input
                  key={measurement}
                  label={measurementLabels[measurement] || measurement}
                  placeholder={`Enter ${measurementLabels[measurement] || measurement}`}
                  value={values[measurement]}
                  onChangeText={(text) => {
                    const sanitizedText = text.replace(/[^0-9.]/g, '');
                    handleChange(measurement)(sanitizedText);
                  }}
                  onBlur={handleBlur(measurement)}
                  keyboardType="numeric"
                  error={touched[measurement] && errors[measurement]}
                  iconName="layout"
                />
              ))}

              <View style={styles.buttonsContainer}>
                <Button
                  title="Submit Order"
                  onPress={formikSubmit}
                  loading={loading}
                  disabled={loading}
                />

                <Button
                  title="Go Back"
                  onPress={() => navigation.goBack()}
                  outline
                  buttonStyle={styles.backButton}
                  disabled={loading}
                />
              </View>
            </View>
          );
        }}
      </Formik>

      {/* Canvas Modal */}
      <Modal
        visible={isCanvasVisible}
        animationType="slide"
        onRequestClose={() => setIsCanvasVisible(false)}
      >
        <DrawingCanvas 
          onSave={handleCanvasSave}
          onClose={() => setIsCanvasVisible(false)}
        />
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  contentContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100
  },
  headerContainer: {
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.gray,
    textTransform: 'capitalize'
  },
  designReferenceContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.black
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 16
  },
  imageOptionContainer: {
    marginBottom: 16
  },
  imageOptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.lightGray
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.error,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  measurementGuideContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24
  },
  measurementGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  measurementGuideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.black
  },
  measurementGuideText: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12
  },
  formContainer: {
    marginBottom: 40
  },
  buttonsContainer: {
    marginTop: 24,
    marginBottom: 40
  },
  backButton: {
    marginTop: 12
  }
});

export default MeasurementScreen;