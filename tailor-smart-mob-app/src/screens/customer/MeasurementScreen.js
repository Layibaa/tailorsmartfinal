import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image
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
  // Add this import at the top of MeasurementScreen.js
  import { EventRegister } from 'react-native-event-listeners';
const MeasurementScreen = ({ route, navigation }) => {
  const { tailorId, tailorName, garmentType, notes } = route.params;
  const [loading, setLoading] = useState(false);
  const [requiredMeasurements, setRequiredMeasurements] = useState([]);

// Add this to your MeasurementScreen.js useEffect
useEffect(() => {
  // Test API connection
  const testApiConnection = async () => {
    try {
      console.log('Testing API connection...');
      // Use the api instance instead of axios directly
      const response = await api.get('/health-check');
      console.log('API connection successful:', response.data);
    } catch (error) {
      console.error('API connection failed:', error.message);
      console.error('Error details:', error.response || error);
    }
  };
  
  testApiConnection();
  
  // Get the required measurements for the selected garment type
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
    }
  });
  
  console.log("Processed measurements:", measurements);

  try {
    // Create order data object
    const orderData = {
      tailorId,
      garmentType,
      measurements,
      notes
    };
    
    console.log("Sending order data to API:", orderData);
    
    // Make the API call
    const response = await createOrder(orderData);
    
    console.log("API response received:", response);
    
    // Emit a global event with the new order data
    EventRegister.emit('newOrderCreated', response.order);
    
    // Show success popup
    Alert.alert(
      'Success',
      'Your order has been sent to the tailor for review.',
      [
        { 
          text: 'OK', 
          onPress: () => {
            console.log("Navigating to Orders screen");
            // Use reset to clear navigation stack
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
    // Get more detailed error information
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

      <View style={styles.measurementGuideContainer}>
        <View style={styles.measurementGuideHeader}>
          <Feather name="info" size={15} color={colors.black} />
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
  {({ handleChange, handleBlur, handleSubmit: formikSubmit, values, errors, touched }) => (
    <View style={styles.formContainer}>
      {requiredMeasurements.map((measurement) => (
        <Input
          key={measurement}
          label={measurementLabels[measurement]}
          placeholder={`Enter ${measurement} measurement`}
          value={values[measurement]}
          onChangeText={(text) => {
            // Only allow numbers and decimal point
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
        onPress={() => {
          console.log("was tetsing nav but now its the default button for submitting");
          formikSubmit();
          navigation.navigate('Orders');
        }}
        loading={loading}
        
        buttonStyle={{ marginTop: 10 }}
      />
       {/* <Button
          title="Submit Order"
          onPress={() => {
            console.log("Submit button pressed");
            console.log("Form values:", values);
            console.log("Form errors:", errors);
            // This calls Formik's handleSubmit
            formikSubmit();
          }}
          loading={loading}
        /> */}
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          outline
          buttonStyle={styles.backButton}
        />
        
      </View>
    </View>
  )}
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
