// Updated MeasurementScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  Switch
} from 'react-native';
import { Formik } from 'formik';
import { Feather } from '@expo/vector-icons';
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



const MeasurementScreen = ({ route, navigation }) => {
  const { tailorId, tailorName, garmentType, notes } = route.params;
  const [loading, setLoading] = useState(false);
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);
  const [formikRef, setFormikRef] = useState(null);

  // Use the autofill hook
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
    const testApiConnection = async () => {
      try {
        console.log('Testing API connection...');
        const response = await api.get('/health-check');
        console.log('API connection successful:', response.data);
      } catch (error) {
        console.error('API connection failed:', error.message);
        console.error('Error details:', error.response || error);
      }
    };
    
    testApiConnection();
    
    const measurements = getRequiredMeasurementsForGarment(garmentType);
    setRequiredMeasurements(measurements);
  }, [garmentType]);

  // Initial form values - set all to empty
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

<<<<<<< HEAD

  const fetchPrediction = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/predict", {
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender
    });
    setMeasurements(res.data);
  } catch (err) {
    console.error(err);
  }
};

  // Submit order

const handleSubmit = async (values) => {
  console.log("handleSubmit called with values:", values);
  
  // Check if required measurements are present
  const missingMeasurements = requiredMeasurements.filter(
    key => !values[key] || values[key] === ''
  );
  
  if (missingMeasurements.length > 0) {
    console.log("Missing required measurements:", missingMeasurements);
    Alert.alert(
      "Missing Measurements",
      `Please enter values for: ${missingMeasurements.join(', ')}`
    );
    return;
  }
  
  setLoading(true);
  
  // Convert string values to numbers
  const measurements = {};
  requiredMeasurements.forEach(key => {
    if (values[key]) {
      measurements[key] = parseFloat(values[key]);
=======
  // Handle autofill button press
  const handleAutofill = async () => {
    console.log('Autofill clicked. Profile complete:', isProfileComplete);
    console.log('Customer profile:', customerProfile);
    
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
              console.log('Profile refreshed');
            }
          },
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
>>>>>>> addedadmin
    }

    try {
      const predictions = await generatePredictedMeasurements();
      if (predictions && formikRef) {
        // Set the predicted values in the form
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

  const handleSubmit = async (values) => {
    console.log("handleSubmit called with values:", values);
    
    const missingMeasurements = requiredMeasurements.filter(
      key => !values[key] || values[key] === ''
    );
    
    if (missingMeasurements.length > 0) {
      console.log("Missing required measurements:", missingMeasurements);
      Alert.alert(
        "Missing Measurements",
        `Please enter values for: ${missingMeasurements.join(', ')}`
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
        notes
      };
      
      console.log("Sending order data to API:", orderData);
      
      const response = await createOrder(orderData);
      
      console.log("API response received:", response);
      
      EventRegister.emit('newOrderCreated', response.order);
      
      Alert.alert(
        'Success',
        'Your order has been sent to the tailor for review.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              console.log("Navigating to Orders screen");
              navigation.reset({
                index: 0,
                routes: [{ name: 'Orders' }],
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating order:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request:', error.request);
      }
      
      Alert.alert(
        'Error',
        error.response?.data?.msg || error.message || 'Failed to create order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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

      <View style={styles.measurementGuideContainer}>
        <View style={styles.measurementGuideHeader}>
          <Feather name="info" size={20} color={colors.black} />
          <Text style={styles.measurementGuideTitle}>Measurement Guide</Text>
        </View>
        <Text style={styles.measurementGuideText}>
          Please provide accurate measurements in centimeters. Refer to the guide below
          for how to measure correctly.
        </Text>
         
      </View>

      <Formik
        initialValues={initialValues}
        validationSchema={MeasurementsSchema[garmentType]}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched, setFieldValue }) => {
          // Store formik reference for autofill
          if (!formikRef) {
            setFormikRef({ setFieldValue });
          }

          return (
            <View style={styles.formContainer}>
              {requiredMeasurements.map((measurement) => (
                <Input
                  key={measurement}
                  label={measurementLabels[measurement]}
                  placeholder={`Enter ${measurement} measurement`}
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
  onPress={async () => {
    await formikSubmit();       // first submit form
    navigation.navigate('Orders'); // then navigate
  }}
  loading={loading}
  buttonStyle={{ marginTop: 10 }}
/>

                <Button
                  title="Go Back"
                  onPress={() => navigation.goBack()}
                  outline
                  buttonStyle={styles.backButton}
                />
              </View>
            </View>
          );
        }}
      </Formik>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  contentContainer: {
    padding: 16
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
  measurementImage: {
    width: '100%',
    height: 200,
    borderRadius: 8
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