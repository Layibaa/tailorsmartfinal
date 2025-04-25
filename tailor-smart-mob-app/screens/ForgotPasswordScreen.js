import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Formik } from 'formik';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import AuthHeader from '../components/AuthHeader';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import LoadingOverlay from '../components/LoadingOverlay';

// Utils
import { forgotPasswordSchema } from '../utils/validationSchemas';
import authService from '../utils/authService';
import { AuthContext } from '../utils/authContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthError } = useContext(AuthContext);

  // Handle forgot password submission
  const handleForgotPassword = async (values) => {
    setIsLoading(true);
    try {
      // Call forgot password API
      await authService.forgotPassword(values.mobileNumber);
      
      // Navigate to OTP verification screen
      navigation.navigate('OTPVerification', {
        mobileNumber: values.mobileNumber,
        purpose: 'password_reset',
      });
    } catch (error) {
      setAuthError(error);
      Alert.alert('Error', error.message || 'Failed to process forgot password request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Forgot Password" showBackButton={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Your Password</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number and we'll send an OTP to reset your password
            </Text>
          </View>

          <Formik
            initialValues={{ mobileNumber: '' }}
            validationSchema={forgotPasswordSchema}
            onSubmit={handleForgotPassword}
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
                  placeholder="Enter your registered mobile number"
                  icon="phone"
                  keyboardType="phone-pad"
                  value={values.mobileNumber}
                  onChangeText={handleChange('mobileNumber')}
                  onBlur={handleBlur('mobileNumber')}
                  error={errors.mobileNumber}
                  touched={touched.mobileNumber}
                />

                <FormButton
                  buttonTitle="Send OTP"
                  onPress={handleSubmit}
                  disabled={!(isValid && dirty)}
                  isLoading={isLoading}
                />
              </View>
            )}
          </Formik>

          <TouchableOpacity
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={isLoading} message="Sending OTP..." />
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  backToLogin: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  backToLoginText: {
    color: '#0066CC',
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
