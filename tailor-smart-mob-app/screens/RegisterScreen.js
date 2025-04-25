import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Formik } from 'formik';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import AuthHeader from '../components/AuthHeader';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import LoadingOverlay from '../components/LoadingOverlay';

// Utils
import {
  customerRegistrationSchema,
  tailorRegistrationSchema,
} from '../utils/validationSchemas';
import authService from '../utils/authService';
import { AuthContext } from '../utils/authContext';

const RegisterScreen = ({ navigation }) => {
  const [userType, setUserType] = useState('customer');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthError } = useContext(AuthContext);

  const handleRegister = async (values) => {
    setIsLoading(true);
    try {
      // Format the data based on user type
      const userData = userType === 'customer' 
        ? {
            mobileNumber: values.mobileNumber,
            password: values.password,
            gender: values.gender,
            age: values.age,
            height: values.height,
            weight: values.weight,
          }
        : {
            mobileNumber: values.mobileNumber,
            password: values.password,
            shopName: values.shopName,
            location: values.location,
            priceRange: {
              min: values.priceRangeMin,
              max: values.priceRangeMax,
            },
          };

      // Register the user
      const response = await authService.register(userData, userType);

      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        mobileNumber: values.mobileNumber,
        purpose: 'registration',
      });
    } catch (error) {
      setAuthError(error);
      Alert.alert('Registration Failed', error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Create Account" showBackButton={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Join TailorSmart</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          <View style={styles.userTypeContainer}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'customer' && styles.activeUserType,
              ]}
              onPress={() => setUserType('customer')}
            >
              <Text
                style={[
                  styles.userTypeText,
                  userType === 'customer' && styles.activeUserTypeText,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                userType === 'tailor' && styles.activeUserType,
              ]}
              onPress={() => setUserType('tailor')}
            >
              <Text
                style={[
                  styles.userTypeText,
                  userType === 'tailor' && styles.activeUserTypeText,
                ]}
              >
                Tailor
              </Text>
            </TouchableOpacity>
          </View>

          <Formik
            initialValues={
              userType === 'customer'
                ? {
                    mobileNumber: '',
                    password: '',
                    confirmPassword: '',
                    gender: '',
                    age: '',
                    height: '',
                    weight: '',
                  }
                : {
                    mobileNumber: '',
                    password: '',
                    confirmPassword: '',
                    shopName: '',
                    location: '',
                    priceRangeMin: '',
                    priceRangeMax: '',
                  }
            }
            validationSchema={
              userType === 'customer'
                ? customerRegistrationSchema
                : tailorRegistrationSchema
            }
            onSubmit={handleRegister}
            enableReinitialize
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              isValid,
              dirty,
            }) => (
              <View style={styles.formContainer}>
                <FormInput
                  label="Mobile Number"
                  placeholder="Enter your mobile number"
                  icon="phone"
                  keyboardType="phone-pad"
                  value={values.mobileNumber}
                  onChangeText={handleChange('mobileNumber')}
                  onBlur={handleBlur('mobileNumber')}
                  error={errors.mobileNumber}
                  touched={touched.mobileNumber}
                />

                <FormInput
                  label="Password"
                  placeholder="Enter your password"
                  icon="lock"
                  secureTextEntry
                  value={values.password}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  error={errors.password}
                  touched={touched.password}
                />

                <FormInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  icon="lock"
                  secureTextEntry
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                />

                {userType === 'customer' ? (
                  // Customer specific fields
                  <>
                    <FormInput
                      label="Gender"
                      placeholder="Enter your gender (male/female/other)"
                      icon="user"
                      value={values.gender}
                      onChangeText={handleChange('gender')}
                      onBlur={handleBlur('gender')}
                      error={errors.gender}
                      touched={touched.gender}
                    />

                    <FormInput
                      label="Age"
                      placeholder="Enter your age"
                      icon="calendar"
                      keyboardType="numeric"
                      value={values.age}
                      onChangeText={handleChange('age')}
                      onBlur={handleBlur('age')}
                      error={errors.age}
                      touched={touched.age}
                    />

                    <FormInput
                      label="Height (cm)"
                      placeholder="Enter your height in cm"
                      icon="trending-up"
                      keyboardType="numeric"
                      value={values.height}
                      onChangeText={handleChange('height')}
                      onBlur={handleBlur('height')}
                      error={errors.height}
                      touched={touched.height}
                    />

                    <FormInput
                      label="Weight (kg)"
                      placeholder="Enter your weight in kg"
                      icon="activity"
                      keyboardType="numeric"
                      value={values.weight}
                      onChangeText={handleChange('weight')}
                      onBlur={handleBlur('weight')}
                      error={errors.weight}
                      touched={touched.weight}
                    />
                  </>
                ) : (
                  // Tailor specific fields
                  <>
                    <FormInput
                      label="Shop Name"
                      placeholder="Enter your shop name"
                      icon="home"
                      value={values.shopName}
                      onChangeText={handleChange('shopName')}
                      onBlur={handleBlur('shopName')}
                      error={errors.shopName}
                      touched={touched.shopName}
                    />

                    <FormInput
                      label="Location"
                      placeholder="Enter your shop location"
                      icon="map-pin"
                      value={values.location}
                      onChangeText={handleChange('location')}
                      onBlur={handleBlur('location')}
                      error={errors.location}
                      touched={touched.location}
                    />

                    <FormInput
                      label="Minimum Price Range"
                      placeholder="Enter minimum price"
                      icon="dollar-sign"
                      keyboardType="numeric"
                      value={values.priceRangeMin}
                      onChangeText={handleChange('priceRangeMin')}
                      onBlur={handleBlur('priceRangeMin')}
                      error={errors.priceRangeMin}
                      touched={touched.priceRangeMin}
                    />

                    <FormInput
                      label="Maximum Price Range"
                      placeholder="Enter maximum price"
                      icon="dollar-sign"
                      keyboardType="numeric"
                      value={values.priceRangeMax}
                      onChangeText={handleChange('priceRangeMax')}
                      onBlur={handleBlur('priceRangeMax')}
                      error={errors.priceRangeMax}
                      touched={touched.priceRangeMax}
                    />
                  </>
                )}

                <FormButton
                  buttonTitle="Register"
                  onPress={handleSubmit}
                  disabled={!(isValid && dirty)}
                  isLoading={isLoading}
                />
              </View>
            )}
          </Formik>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={isLoading} message="Registering..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userTypeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  userTypeText: {
    fontWeight: '600',
    color: '#666',
  },
  activeUserType: {
    backgroundColor: '#0066CC',
  },
  activeUserTypeText: {
    color: 'white',
  },
  formContainer: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  footerText: {
    color: '#666',
    marginRight: 5,
  },
  loginText: {
    color: '#0066CC',
    fontWeight: '600',
  },
});

export default RegisterScreen;
