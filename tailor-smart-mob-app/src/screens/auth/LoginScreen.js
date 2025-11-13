import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors'; 

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

const LoginScreen = ({ navigation }) => {
  const { login, isLoading } = useContext(AuthContext);
  const [error, setError] = useState('');

  const handleLogin = async (values) => {
    setError('');
    
    try {
      const result = await login(values.email, values.password);
      
      if (!result || !result.success) {
        if (result && result.requiresVerification) {
          navigation.navigate('OtpVerification', { userId: result.userId });
        } else {
          setError('Wrong email or password');
        }
      }
    } catch (err) {
      setError('Wrong email or password');
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
        </View>
        
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleLogin}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.formContainer}>
              {/* ERROR MESSAGE - SIMPLE */}
              {error && <Text style={styles.errorText}>{error}</Text>}
              
              <Input
                placeholder="Email"
                value={values.email}
                onChangeText={(text) => {
                  handleChange('email')(text);
                  if (error) setError('');
                }}
                onBlur={handleBlur('email')}
                keyboardType="email-address"
                autoCapitalize="none"
                error={touched.email && errors.email}
                iconName="mail"
              />
              
              <Input
                placeholder="Password"
                value={values.password}
                onChangeText={(text) => {
                  handleChange('password')(text);
                  if (error) setError('');
                }}
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
  formContainer: {
    width: '100%'
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center'
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20
  },
  forgotPasswordText: {
    color: colors.black,
    fontSize: 14
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
  }
});

export default LoginScreen;