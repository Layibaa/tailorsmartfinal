import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { forgotPassword } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const ForgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required')
});

const ForgotPasswordScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await forgotPassword(values.email);
      Alert.alert(
        'Reset Email Sent',
        'If an account exists with that email, we have sent instructions to reset your password.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    } catch (error) {
      setError(error.response?.data?.msg || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you instructions to reset your password.
        </Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{ email: '' }}
          validationSchema={ForgotPasswordSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <Input
                placeholder="Email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email && errors.email}
                iconName="mail"
              />
              
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Button title="Send Reset Email" onPress={handleSubmit} />
              )}
              
              <Button 
                title="Back to Login" 
                onPress={() => navigation.navigate('Login')} 
                buttonStyle={styles.backButton}
                textStyle={styles.backButtonText}
              />
            </View>
          )}
        </Formik>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 30,
    lineHeight: 22
  },
  formContainer: {
    width: '100%'
  },
  errorText: {
    color: colors.error,
    marginBottom: 15
  },
  backButton: {
    backgroundColor: 'transparent',
    marginTop: 10
  },
  backButtonText: {
    color: colors.black
  }
});

export default ForgotPasswordScreen;
