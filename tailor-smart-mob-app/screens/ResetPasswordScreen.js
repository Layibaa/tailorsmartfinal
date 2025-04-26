import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { resetPassword } from '../api/authApi';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

// Validation schema
const resetPasswordSchema = Yup.object().shape({
  otp: Yup.string()
    .length(6, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      'Password must have at least 1 uppercase letter, 1 number, and 1 special character'
    )
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

const ResetPasswordScreen = ({ route, navigation }) => {
  const { email } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResetPassword = async (values) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await resetPassword(email, values.otp, values.newPassword);
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now login with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Logo />
      
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter the OTP sent to {email} and your new password
      </Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Formik
        initialValues={{ otp: '', newPassword: '', confirmPassword: '' }}
        validationSchema={resetPasswordSchema}
        onSubmit={handleResetPassword}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <>
            <FormInput
              placeholder="6-digit OTP"
              onChangeText={handleChange('otp')}
              onBlur={handleBlur('otp')}
              value={values.otp}
              keyboardType="numeric"
              error={touched.otp && errors.otp}
              maxLength={6}
            />
            
            <FormInput
              placeholder="New Password"
              onChangeText={handleChange('newPassword')}
              onBlur={handleBlur('newPassword')}
              value={values.newPassword}
              secureTextEntry
              error={touched.newPassword && errors.newPassword}
            />
            
            <FormInput
              placeholder="Confirm New Password"
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              value={values.confirmPassword}
              secureTextEntry
              error={touched.confirmPassword && errors.confirmPassword}
            />
            
            <FormButton title="Reset Password" onPress={handleSubmit} />
          </>
        )}
      </Formik>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.backButtonText}>Resend OTP</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  backButton: {
    marginTop: SIZES.padding * 2,
    padding: SIZES.padding,
  },
  backButtonText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default ResetPasswordScreen;
