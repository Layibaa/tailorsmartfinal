import React, { useState, useContext, useEffect } from 'react';
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
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import LoadingOverlay from '../components/LoadingOverlay';

// Utils
import { loginSchema, adminLoginSchema } from '../utils/validationSchemas';
import authService from '../utils/authService';
import { AuthContext } from '../utils/authContext';

const LoginScreen = ({ navigation }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, setAuthError, authState, clearError } = useContext(AuthContext);

  // Clear any existing errors on screen mount
  useEffect(() => {
    clearError();
  }, []);

  // Handle error messages
  useEffect(() => {
    if (authState.authError) {
      Alert.alert('Login Failed', authState.authError.message);
      clearError();
    }
  }, [authState.authError]);

  // Handle login submission
  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      let loginData;
      
      if (isAdmin) {
        // Admin login with hardcoded credentials
        loginData = await authService.adminLogin(values.username, values.password);
        await login(loginData.token, loginData.user);
      } else {
        try {
          // Regular user login
          loginData = await authService.login(values.mobileNumber, values.password);
          await login(loginData.token, loginData.user);
        } catch (loginError) {
          // Check if it's an unverified account that needs OTP verification
          if (loginError.requiresVerification) {
            // Show debug OTP if available
            let message = loginError.message || 'Your account needs verification. Please enter the OTP sent to your mobile.';
            
            if (loginError.debug && loginError.debug.otp) {
              message += `\n\nDEV MODE: The OTP is ${loginError.debug.otp}`;
            }
            
            Alert.alert('Verification Required', message);
            
            // Navigate to OTP verification screen
            navigation.navigate('OTPVerification', {
              mobileNumber: values.mobileNumber,
              purpose: 'login',
            });
            
            // Don't treat this as an error since we're handling it
            return;
          }
          
          // For other errors, rethrow
          throw loginError;
        }
      }
    } catch (error) {
      setAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between user and admin login
  const toggleAdminLogin = () => {
    setIsAdmin(!isAdmin);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>TailorSmart</Text>
            <Text style={styles.subtitle}>
              {isAdmin ? 'Admin Login' : 'Welcome Back'}
            </Text>
          </View>

          <Formik
            initialValues={
              isAdmin
                ? { username: '', password: '' }
                : { mobileNumber: '', password: '' }
            }
            validationSchema={isAdmin ? adminLoginSchema : loginSchema}
            onSubmit={handleLogin}
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
                {isAdmin ? (
                  <FormInput
                    label="Username"
                    placeholder="Enter admin username"
                    icon="user"
                    value={values.username}
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    error={errors.username}
                    touched={touched.username}
                  />
                ) : (
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
                )}

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

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate('ForgotPassword')}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <FormButton
                  buttonTitle="Login"
                  onPress={handleSubmit}
                  disabled={!(isValid && dirty)}
                  isLoading={isLoading}
                />
              </View>
            )}
          </Formik>

          {!isAdmin && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.registerText}>Register Now</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.adminToggle}
            onPress={toggleAdminLogin}
          >
            <Text style={styles.adminToggleText}>
              {isAdmin ? 'Switch to User Login' : 'Admin Login'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={isLoading} message="Logging in..." />
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
    marginVertical: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    marginTop: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  forgotPasswordText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: '#666',
    marginRight: 5,
  },
  registerText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  adminToggle: {
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
  },
  adminToggleText: {
    color: '#0066CC',
    fontWeight: '500',
  },
});

export default LoginScreen;
