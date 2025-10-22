// ✨ FIXED: MeasurementScreen.js with proper scrolling and image handling
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import SignatureCanvas from 'react-native-signature-canvas';
import { 
  MeasurementsSchema, 
  getRequiredMeasurementsForGarment,
  measurementLabels
} from '../../utils/validation'; 
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';
import api, { API_URL, createOrder } from '../../services/api';
import { EventRegister } from 'react-native-event-listeners';
import { useAutofillMeasurements } from '../../hooks/useAutofillMeasurements';

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
  const signatureRef = useRef(null);

  const {
    isAutofillEnabled,
    isLoading: autofillLoading,
    customerProfile,
    isProfileComplete,
    toggleAutofill,
    generatePredictedMeasurements,
    refreshProfile
  } = useAutofillMeasurements();

  useEffect(() => {
    const measurements = getRequiredMeasurementsForGarment(garmentType);
    setRequiredMeasurements(measurements);
    requestPermissions();
  }, [garmentType]);

  // Request Permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to upload images.');
    }
  };

  // Pick Image from Gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size
        const sizeInMB = (asset.base64.length * 3) / (4 * 1024 * 1024);
        
        if (sizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        // Store as base64 with proper data URI
        const base64Image = `data:image/jpeg;base64,${asset.base64}`;
        setReferenceImage({
          uri: asset.uri,
          base64: base64Image
        });
        
        Alert.alert('Success', 'Reference image added successfully!');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Open Canvas for Drawing
  const openCanvas = () => {
    setIsCanvasVisible(true);
  };

  // Handle Canvas Save
  const handleCanvasSave = (signature) => {
    setCustomerSketch(signature);
    setIsCanvasVisible(false);
    Alert.alert('Success', 'Your sketch has been saved!');
  };

  // Clear Reference Image
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

  // Clear Sketch - FIXED: Moved function definition before JSX
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

  // Handle autofill
  const handleAutofill = async () => {
    if (!isProfileComplete) {
      Alert.alert(
        'Profile Incomplete',
        'Please complete your profile (age, gender, height, weight) to use autofill.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Refresh Profile', 
            onPress: async () => {
              await refreshProfile();
            }
          },
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }

    try {
      const predictions = await generatePredictedMeasurements();
      if (predictions && formikRef) {
        Object.keys(predictions).forEach(key => {
          if (requiredMeasurements.includes(key)) {
            formikRef.setFieldValue(key, predictions[key].toString());
          }
        });

        Alert.alert(
          'Measurements Autofilled',
          'AI has predicted your measurements based on your profile. Please review and adjust as needed.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Autofill error:', error);
      Alert.alert('Error', 'Failed to generate predicted measurements. Please enter manually.');
    }
  };

  // Initial form values
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
    console.log("handleSubmit called with values:", values);
    
    const missingMeasurements = requiredMeasurements.filter(
      key => !values[key] || values[key] === ''
    );
    
    if (missingMeasurements.length > 0) {
      console.log("Missing required measurements:", missingMeasurements);
      Alert.alert(
        "Missing Measurements",
        `Please enter values for: ${missingMeasurements.map(m => measurementLabels[m] || m).join(', ')}`
      );
      return;
    }
    
    setLoading(true);
    
    const measurements = {};
    requiredMeasurements.forEach(key => {
      if (values[key]) {
        measurements[key] = parseFloat(values[key]);
      }
    });
    
    console.log("Processed measurements:", measurements);

    try {
      const orderData = {
        tailorId,
        garmentType,
        measurements,
        notes: notes || '',
        // Only include images if they exist
        ...(referenceImage?.base64 && { referenceImage: referenceImage.base64 }),
        ...(customerSketch && { customerSketch: customerSketch })
      };
      
      console.log("Sending order data:", {
        ...orderData,
        referenceImage: referenceImage ? 'HAS_IMAGE' : null,
        customerSketch: customerSketch ? 'HAS_SKETCH' : null
      });
      
      const response = await createOrder(orderData);
      
      console.log("Order created successfully:", response);
      
      EventRegister.emit('newOrderCreated', response.order);
      
      Alert.alert(
        'Success',
        'Your order has been sent to the tailor for review.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'CustomerTabs', params: { screen: 'Orders' } }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      Alert.alert(
        'Error',
        error.response?.data?.msg || error.message || 'Failed to create order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Enter Measurements</Text>
          <Text style={styles.headerSubtitle}>
            For {garmentType} • Tailor: {tailorName}
          </Text>
        </View>

        {/* Autofill Toggle Section */}
        <View style={styles.autofillContainer}>
          <View style={styles.autofillHeader}>
            <View style={styles.autofillTitleContainer}>
              <Feather name="zap" size={20} color={colors.primary} />
              <Text style={styles.autofillTitle}>AI Autofill</Text>
            </View>
            <Switch
              value={isAutofillEnabled}
              onValueChange={toggleAutofill}
              trackColor={{ false: colors.lightGray, true: colors.primary + '40' }}
              thumbColor={isAutofillEnabled ? colors.primary : colors.gray}
            />
          </View>
          <Text style={styles.autofillDescription}>
            Use AI to predict your measurements based on your profile data
          </Text>
          
          {isAutofillEnabled && (
            <TouchableOpacity
              style={styles.autofillButton}
              onPress={handleAutofill}
              disabled={autofillLoading || !isProfileComplete}
            >
              <Feather 
                name="zap" 
                size={16} 
                color={autofillLoading || !isProfileComplete ? colors.gray : colors.white} 
              />
              <Text style={[
                styles.autofillButtonText,
                { color: autofillLoading || !isProfileComplete ? colors.gray : colors.white }
              ]}>
                {autofillLoading ? 'Predicting...' : 'Auto-fill Measurements'}
              </Text>
            </TouchableOpacity>
          )}
          
          {!isProfileComplete && isAutofillEnabled && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Complete your profile to enable autofill
              </Text>
            </View>
          )}
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
                    buttonStyle={{ marginTop: 10 }}
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
          <View style={styles.canvasModal}>
            <View style={styles.canvasHeader}>
              <Text style={styles.canvasTitle}>Draw Your Design</Text>
              <TouchableOpacity onPress={() => setIsCanvasVisible(false)}>
                <Feather name="x" size={24} color={colors.black} />
              </TouchableOpacity>
            </View>
            
            <SignatureCanvas
              ref={signatureRef}
              onOK={handleCanvasSave}
              descriptionText="Draw your design sketch here"
              clearText="Clear"
              confirmText="Save"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: 1px solid #e8e8e8;
                  background-color: white;
                }
                .m-signature-pad--body {
                  border: none;
                }
                .m-signature-pad--footer {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px;
                }
              `}
            />
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40 // Extra padding at bottom for scrolling
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
  autofillContainer: {
    backgroundColor: colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20'
  },
  autofillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  autofillTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  autofillTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.black
  },
  autofillDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20,
    marginBottom: 12
  },
  autofillButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  autofillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: 6,
    padding: 8
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    marginLeft: 6
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
  canvasModal: {
    flex: 1,
    backgroundColor: colors.white
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  canvasTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black
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
    marginBottom: 24
  },
  buttonsContainer: {
    marginTop: 24
  },
  backButton: {
    marginTop: 12
  }
});

export default MeasurementScreen;