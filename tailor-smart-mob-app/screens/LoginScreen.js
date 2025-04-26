import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

// Validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});

const LoginScreen = ({ navigation }) => {
  const { loginUser, error, setError, isLoading } = useContext(AuthContext);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleLogin = async (values) => {
    const result = await loginUser(values.email, values.password);
    if (result.success) {
      console.log('Login successful');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Logo />
            
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1487700160041-babef9c3cb55' }}
              style={styles.backgroundImage}
            />
            
            <Text style={styles.title}>
              {showAdminLogin ? 'Admin Login' : 'Welcome Back'}
            </Text>
            
            <Text style={styles.subtitle}>
              {showAdminLogin 
                ? 'Sign in to your admin account' 
                : 'Sign in to your customer or tailor account'}
            </Text>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            {!showAdminLogin ? (
              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={loginSchema}
                onSubmit={handleLogin}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                  <>
                    <FormInput
                      placeholder="Email"
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      value={values.email}
                      keyboardType="email-address"
                      error={touched.email && errors.email}
                      autoCapitalize="none"
                    />
                    
                    <FormInput
                      placeholder="Password"
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      value={values.password}
                      secureTextEntry
                      error={touched.password && errors.password}
                    />
                    
                    <TouchableOpacity
                      onPress={() => {
                        setError(null);
                        navigation.navigate('ForgotPassword');
                      }}
                      style={styles.forgotPasswordContainer}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
                    <FormButton title="Login" onPress={handleSubmit} />
                  </>
                )}
              </Formik>
            ) : (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  setError(null);
                  navigation.navigate('AdminLogin');
                }}
              >
                <Text style={styles.switchButtonText}>Go to Admin Login</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Don't have an account?
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.signupButton}
                  onPress={() => {
                    setError(null);
                    navigation.navigate('CustomerSignup');
                  }}
                >
                  <Text style={styles.signupButtonText}>Customer Signup</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.signupButton}
                  onPress={() => {
                    setError(null);
                    navigation.navigate('TailorSignup');
                  }}
                >
                  <Text style={styles.signupButtonText}>Tailor Signup</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setError(null);
                setShowAdminLogin(!showAdminLogin);
              }}
            >
              <Text style={styles.switchButtonText}>
                {showAdminLogin ? 'Customer/Tailor Login' : 'Admin Login'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 20,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  forgotPasswordContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: SIZES.padding,
  },
  forgotPasswordText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
  },
  footerText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  signupButton: {
    flex: 1,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  signupButtonText: {
    ...FONTS.body4,
    color: COLORS.primary,
  },
  switchButton: {
    marginTop: SIZES.padding * 2,
    padding: SIZES.padding,
  },
  switchButtonText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
