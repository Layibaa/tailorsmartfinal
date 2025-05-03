import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import AdminLoginForm from '../../components/forms/AdminLoginForm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const LoginScreen = ({ navigation }) => {
  const { login, isLoading, setUserToken, setUser } = useContext(AuthContext);
  const [error, setError] = useState(null);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const handleLogin = async (values) => {
    setError(null);
    const result = await login(values.email, values.password);
    
    if (!result.success) {
      if (result.requiresVerification) {
        navigation.navigate('OtpVerification', { userId: result.userId });
      } else {
        setError(result.error);
      }
    }
  };

  const handleAdminLogin = async (result) => {
    if (result.success) {
      // Store admin user data and token
      await AsyncStorage.setItem('userToken', result.token);
      await AsyncStorage.setItem('user', JSON.stringify(result.user));
      
      // Update context
      setUser(result.user);
      setUserToken(result.token);
    } else {
      setAdminError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
                <Image
          source={require('../../assets/newlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {/*  <Text style={styles.title}>Tailoring App</Text>
          <Text style={styles.subtitle}>Login to your account</Text> */}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
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
              
              <Input
                placeholder="Password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                secureTextEntry
                error={touched.password && errors.password}
                iconName="lock"
              />
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordContainer}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Button title="Login" onPress={handleSubmit} />
              )}
            </View>
          )}
        </Formik>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <View style={styles.signupButtonsContainer}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CustomerSignup')}
              style={[styles.signupButton, styles.customerButton]}
            >
              <Text style={styles.signupButtonText}>Customer Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('TailorSignup')}
              style={[styles.signupButton, styles.tailorButton]}
            >
              <Text style={styles.signupButtonText}>Tailor Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Admin Login Button */}
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => setAdminModalVisible(true)}
        >
          <Text style={styles.adminButtonText}>Admin Login</Text>
        </TouchableOpacity>
        
        {/* Admin Login Modal */}
        <Modal
          visible={adminModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAdminModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Admin Login</Text>
              <AdminLoginForm 
                onSubmit={handleAdminLogin} 
                isLoading={isLoading}
                error={adminError}
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setAdminModalVisible(false);
                  setAdminError(null);
                }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
  scrollView: {
    flexGrow: 1,
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 75
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 10
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 5
  },
  formContainer: {
    width: '100%'
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20
  },
  forgotPasswordText: {
    color: colors.black,
    fontSize: 14
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 10
  },
  signupContainer: {
    marginTop: 40,
    alignItems: 'center'
  },
  signupText: {
    fontSize: 16,
    color: colors.gray
  },
  signupButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15
  },
  signupButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5
  },
  customerButton: {
    backgroundColor: colors.lightGray
  },
  tailorButton: {
    backgroundColor: colors.black
  },
  signupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white
  },
  adminButton: {
    marginTop: 30,
    alignSelf: 'center',
    padding: 10
  },
  adminButtonText: {
    color: colors.gray,
    fontSize: 14,
    textDecorationLine: 'underline'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 20
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center'
  },
  closeButtonText: {
    color: colors.gray,
    fontSize: 16
  }
});

export default LoginScreen;