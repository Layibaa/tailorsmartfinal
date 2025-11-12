// ✅ FIXED: MeasurementScreen.js - with Custom Success Modal
import React, { useState, useEffect, useContext } from 'react';
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
  Platform,
  Switch
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
import { AuthContext } from '../../context/AuthContext';
import { measurementPredictor } from '../../utils/measurementPredictor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MeasurementScreen = ({ route, navigation }) => {
  const { tailorId, tailorName, suitType, shalwarStyle, kameezStyle, notes } = route.params;
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);
  const [formikRef, setFormikRef] = useState(null);
  const [autoFillEnabled, setAutoFillEnabled] = useState(false);
  const [predictedMeasurements, setPredictedMeasurements] = useState(null);
  const [canAutoFill, setCanAutoFill] = useState(false);
  const [hasPeco, setHasPeco] = useState(false);

  // Image & Canvas States
  const [referenceImage, setReferenceImage] = useState(null);
  const [customerSketch, setCustomerSketch] = useState(null);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);

  // ✅ NEW: Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    const measurements = getRequiredMeasurementsForGarment(suitType);
    setRequiredMeasurements(measurements);
    requestPermissions();
    checkAutoFillAvailability();
  }, [suitType]);

  const checkAutoFillAvailability = () => {
    if (user?.customerProfile) {
      const { age, gender, weight, height } = user.customerProfile;
      const hasCompleteProfile = age && gender && weight && height;
      setCanAutoFill(hasCompleteProfile);
      
      if (!hasCompleteProfile) {
        console.log('⚠️ Incomplete profile for autofill:', {
          age: !!age,
          gender: !!gender,
          weight: !!weight,
          height: !!height
        });
      }
    } else {
      setCanAutoFill(false);
    }
  };

  const handleAutoFillToggle = async (newValue) => {
    if (!canAutoFill) {
      Alert.alert(
        'Complete Your Profile',
        'Please complete your profile (age, gender, weight, height) to use auto-fill measurements.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Profile', 
            onPress: () => navigation.navigate('Profile')
          }
        ]
      );
      return;
    }

    setAutoFillEnabled(newValue);

    if (newValue) {
      try {
        const profile = user.customerProfile;
        console.log('📊 Calculating measurements for profile:', profile);
        
        const predicted = measurementPredictor.predictMeasurements(profile);
        
        if (predicted) {
          setPredictedMeasurements(predicted);
          
          if (formikRef?.setFieldValue) {
            requiredMeasurements.forEach(measurement => {
              if (!measurement.includes('dupatta') && predicted[measurement]) {
                formikRef.setFieldValue(measurement, predicted[measurement].toString());
              }
            });
          }

          const confidence = measurementPredictor.getConfidence(profile);
          const bodyFrame = measurementPredictor.getBodyFrame(
            profile.gender, 
            profile.height, 
            profile.weight
          );

          Alert.alert(
            '✨ Measurements Auto-Filled',
            `Based on your profile, we've calculated measurements for a ${bodyFrame} build.\n\n` +
            `Confidence: ${confidence.toUpperCase()}\n\n` +
            `Please review and adjust if needed. Dupatta measurements must be entered manually.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Could not calculate measurements. Please enter manually.');
          setAutoFillEnabled(false);
        }
      } catch (error) {
        console.error('❌ Error calculating measurements:', error);
        Alert.alert('Error', 'Could not calculate measurements. Please enter manually.');
        setAutoFillEnabled(false);
      }
    } else {
      Alert.alert(
        'Clear Auto-Fill',
        'Do you want to clear the auto-filled measurements?',
        [
          { text: 'Keep Values', style: 'cancel' },
          {
            text: 'Clear All',
            style: 'destructive',
            onPress: () => {
              if (formikRef?.setFieldValue) {
                requiredMeasurements.forEach(measurement => {
                  if (!measurement.includes('dupatta')) {
                    formikRef.setFieldValue(measurement, '');
                  }
                });
              }
              setPredictedMeasurements(null);
            }
          }
        ]
      );
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll access is needed to upload images.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (!asset.base64) {
          Alert.alert('Error', 'Failed to process image. Please try again.');
          return;
        }

        const sizeInMB = (asset.base64.length * 0.75) / (1024 * 1024);
        console.log('📊 Image size:', sizeInMB.toFixed(2), 'MB');
        
        if (sizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        let base64Data = asset.base64;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.split(',')[1] || base64Data;
        }

        const mimeType = asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${base64Data}`;
        
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
    console.log('✅ Canvas signature saved');
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
    shoulder: '',
    sleeveLength: '',
    neck: '',
    kameezLength: '',
    waist: '',
    hip: '',
    inseam: '',
    outseam: '',
    thigh: '',
    dupattaLength: '',
    dupattaWidth: ''
  };

  // ✅ NEW: Handle success modal OK button
  const handleSuccessModalOk = () => {
    console.log("📱 Success modal OK clicked, navigating to Order History");
    setShowSuccessModal(false);
    
    // Navigate to Order History
    navigation.navigate('CustomerTabs', { 
      screen: 'Orders',
      params: {
        newOrderAdded: true,
        newOrderData: createdOrder
      }
    });
  };

  // ✅ FIXED: handleSubmit with custom modal
  const handleSubmit = async (values) => {
    console.log("📝 handleSubmit called with values:", values);

    // Validate BODY measurements only
    const missingBodyMeasurements = requiredMeasurements.filter(
      key => !values[key] || values[key] === ''
    );

    if (missingBodyMeasurements.length > 0) {
      console.log("⚠️ Missing body measurements:", missingBodyMeasurements);
      Alert.alert(
        "Missing Measurements",
        `Please enter: ${missingBodyMeasurements.map(m => measurementLabels[m] || m).join(', ')}`
      );
      return;
    }

    // Validate DUPATTA separately for 3-piece
    if (suitType === '3-piece') {
      if (!values.dupattaLength || !values.dupattaWidth) {
        console.log("⚠️ Missing dupatta measurements");
        Alert.alert("Missing Dupatta", "Please enter dupatta length and width");
        return;
      }
    }

    setLoading(true);

    try {
      // Build measurements object (BODY only)
      const measurements = {};
      requiredMeasurements.forEach(key => {
        if (values[key] && !key.includes('dupatta')) {
          measurements[key] = parseFloat(values[key]);
        }
      });

      console.log("📏 Body measurements:", measurements);

      const orderData = {
        tailorId,
        suitType,
        shalwarStyle,
        kameezStyle,
        measurements,
        notes: notes || ''
      };

      // Add dupatta separately if 3-piece
      if (suitType === '3-piece') {
        orderData.dupattaDetails = {
          length: parseFloat(values.dupattaLength),
          width: parseFloat(values.dupattaWidth),
          hasPeco: hasPeco
        };
        console.log("🧣 Dupatta details:", orderData.dupattaDetails);
      }

      // Add images if available
      if (referenceImage?.base64) {
        console.log('📸 Adding reference image');
        orderData.referenceImage = referenceImage.base64;
      }
      if (customerSketch) {
        console.log('✏️ Adding customer sketch');
        orderData.customerSketch = customerSketch;
      }

      const response = await createOrder(orderData);
      console.log("✅ Order created successfully:", response);

      // Stop loading
      setLoading(false);

      // Emit event for real-time updates
      EventRegister.emit('newOrderCreated', response.order);

      // ✅ FIXED: Show custom success modal
      console.log("🎉 Opening success modal");
      setCreatedOrder(response.order);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      setLoading(false);

      const errorMessage = error.response?.data?.msg || 
                           error.message || 
                           'Failed to create order. Please try again.';

      Alert.alert('Error', errorMessage);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
            For {suitType} • Tailor: {tailorName}
          </Text>
        </View>

        {/* Auto-Fill Toggle Section */}
        <View style={styles.autoFillContainer}>
          <View style={styles.autoFillHeader}>
            <View style={styles.autoFillTitleRow}>
              <Feather name="zap" size={20} color={colors.primary} />
              <Text style={styles.autoFillTitle}>Auto-Fill Body Measurements</Text>
            </View>
            <Switch
              value={autoFillEnabled}
              onValueChange={handleAutoFillToggle}
              trackColor={{ false: colors.lightGray, true: colors.primary }}
              thumbColor={autoFillEnabled ? colors.white : colors.gray}
              disabled={!canAutoFill}
            />
          </View>
          
          {canAutoFill ? (
            <Text style={styles.autoFillDescription}>
              ✨ Calculate body measurements based on your profile{suitType === '3-piece' ? '. Dupatta measurements must be entered manually.' : ''}
            </Text>
          ) : (
            <Text style={styles.autoFillWarning}>
              ⚠️ Complete your profile to use auto-fill
            </Text>
          )}

          {autoFillEnabled && predictedMeasurements && (
            <View style={styles.predictionInfo}>
              <Feather name="info" size={16} color={colors.darkGray} />
              <Text style={styles.predictionText}>
                Measurements calculated using Pakistani body standards. Please verify and adjust as needed.
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
          validationSchema={MeasurementsSchema[suitType]}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched, setFieldValue }) => {
            if (!formikRef) {
              setFormikRef({ setFieldValue });
            }

            return (
              <View style={styles.formContainer}>
                {/* Kameez Section */}
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementSectionTitle}>👔 Kameez Measurements</Text>
                  {['chest', 'shoulder', 'sleeveLength', 'neck', 'kameezLength'].map((measurement) => (
                    <Input
                      key={measurement}
                      label={measurementLabels[measurement]}
                      placeholder={`Enter ${measurementLabels[measurement]}`}
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
                </View>

                {/* Shalwar Section */}
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementSectionTitle}>👖 Shalwar Measurements</Text>
                  {['waist', 'hip', 'inseam', 'outseam', 'thigh'].map((measurement) => (
                    <Input
                      key={measurement}
                      label={measurementLabels[measurement]}
                      placeholder={`Enter ${measurementLabels[measurement]}`}
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
                </View>

                {/* Dupatta Section (3-piece only) */}
                {suitType === '3-piece' && (
                  <View style={styles.measurementSection}>
                    <Text style={styles.measurementSectionTitle}>🧣 Dupatta Details</Text>
                    
                    <Input
                      label={measurementLabels.dupattaLength}
                      placeholder="Enter Dupatta Length"
                      value={values.dupattaLength}
                      onChangeText={(text) => {
                        const sanitizedText = text.replace(/[^0-9.]/g, '');
                        handleChange('dupattaLength')(sanitizedText);
                      }}
                      onBlur={handleBlur('dupattaLength')}
                      keyboardType="numeric"
                      error={touched.dupattaLength && errors.dupattaLength}
                      iconName="layout"
                    />

                    <Input
                      label={measurementLabels.dupattaWidth}
                      placeholder="Enter Dupatta Width"
                      value={values.dupattaWidth}
                      onChangeText={(text) => {
                        const sanitizedText = text.replace(/[^0-9.]/g, '');
                        handleChange('dupattaWidth')(sanitizedText);
                      }}
                      onBlur={handleBlur('dupattaWidth')}
                      keyboardType="numeric"
                      error={touched.dupattaWidth && errors.dupattaWidth}
                      iconName="layout"
                    />

                    {/* Peco Toggle */}
                    <View style={styles.pecoContainer}>
                      <View style={styles.pecoLabelContainer}>
                        <Feather name="scissors" size={20} color={colors.black} />
                        <Text style={styles.pecoLabel}>Add Peco (Embellishment)</Text>
                      </View>
                      <Switch
                        value={hasPeco}
                        onValueChange={setHasPeco}
                        trackColor={{ false: colors.lightGray, true: colors.primary }}
                        thumbColor={hasPeco ? colors.white : colors.gray}
                      />
                    </View>
                    {hasPeco && (
                      <View style={styles.pecoInfoBox}>
                        <Feather name="info" size={16} color={colors.primary} />
                        <Text style={styles.pecoInfoText}>
                          Peco decoration will be added to the dupatta edges
                        </Text>
                      </View>
                    )}
                  </View>
                )}

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
      </ScrollView>

      {/* Drawing Canvas Modal */}
      <Modal
        visible={isCanvasVisible}
        animationType="slide"
        onRequestClose={() => setIsCanvasVisible(false)}
      >
        <DrawingCanvas 
          onSave={handleCanvasSave}
          onClose={() => setIsCanvasVisible(false)}
          garmentType={suitType}
          designNotes={notes || ''}
        />
      </Modal>

      {/* ✅ NEW: Success Confirmation Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Feather name="check-circle" size={60} color={colors.success} />
            </View>
            
            <Text style={styles.modalTitle}>Order Confirmed!</Text>
            
            <Text style={styles.modalMessage}>
              Your order has been successfully sent to the tailor for review.
            </Text>
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleSuccessModalOk}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    color: colors.gray
  },
  autoFillContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  autoFillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  autoFillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  autoFillTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: colors.black
  },
  autoFillDescription: {
    fontSize: 14,
    color: colors.darkGray,
    lineHeight: 20
  },
  autoFillWarning: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
    fontStyle: 'italic'
  },
  predictionInfo: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    alignItems: 'flex-start'
  },
  predictionText: {
    fontSize: 13,
    color: colors.darkGray,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18
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
  measurementSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray
  },
  measurementSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16
  },
  pecoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginTop: 12
  }, 
  pecoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  pecoLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    color: colors.black
  },
  pecoInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    marginTop: 8
  },
  pecoInfoText: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    flex: 1
  },
  buttonsContainer: {
    marginTop: 24,
    marginBottom: 40
  },
  backButton: {
    marginTop: 12
  },
  
  // ✅ SUCCESS MODAL STYLES (matching OrderRequestsScreen style)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  modalIconContainer: {
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 12
  },
  modalMessage: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24
  },
  modalButton: {
    backgroundColor: colors.black,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white
  }
});

export default MeasurementScreen;