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
import { resetPasswordSchema } from '../utils/validationSchemas';
import authService from '../utils/authService';
import { AuthContext } from '../utils/authContext';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { mobileNumber } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const { setAuthError } = useContext(AuthContext);

  // Handle reset password submission
  const handleResetPassword = async (values) => {
    setIsLoading(true);
    try {
      // Call reset password API
      await authService.resetPassword(mobileNumber, values.newPassword);
      
      // Show success message and navigate to login screen
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      setAuthError(error);
      Alert.alert('Error', error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="Reset Password" showBackButton={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Create a new password for your account
            </Text>
          </View>

          <Formik
            initialValues={{ newPassword: '', confirmPassword: '' }}
            validationSchema={resetPasswordSchema}
            onSubmit={handleResetPassword}
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
                  label="New Password"
                  placeholder="Enter your new password"
                  icon="lock"
                  secureTextEntry
                  value={values.newPassword}
                  onChangeText={handleChange('newPassword')}
                  onBlur={handleBlur('newPassword')}
                  error={errors.newPassword}
                  touched={touched.newPassword}
                />

                <FormInput
                  label="Confirm New Password"
                  placeholder="Confirm your new password"
                  icon="lock"
                  secureTextEntry
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                />

                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <Text style={styles.requirementText}>• At least 8 characters</Text>
                  <Text style={styles.requirementText}>• At least one uppercase letter</Text>
                  <Text style={styles.requirementText}>• At least one special character</Text>
                  <Text style={styles.requirementText}>• At least one number</Text>
                </View>

                <FormButton
                  buttonTitle="Reset Password"
                  onPress={handleSubmit}
                  disabled={!(isValid && dirty)}
                  isLoading={isLoading}
                />
              </View>
            )}
          </Formik>
        </View>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={isLoading} message="Resetting password..." />
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
  passwordRequirements: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  requirementsTitle: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default ResetPasswordScreen;
