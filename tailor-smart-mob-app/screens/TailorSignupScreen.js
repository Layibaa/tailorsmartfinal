import React, { useState } from 'react';
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
import { tailorSignup } from '../api/authApi';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

// Validation schema for tailor signup
const tailorSignupSchema = Yup.object().shape({
  fullName: Yup.string()
    .required('Full name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      'Password must have at least 1 uppercase letter, 1 number, and 1 special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  shopName: Yup.string()
    .required('Shop name is required'),
  shopLocation: Yup.string()
    .required('Shop location is required'),
  averagePriceRange: Yup.string()
    .required('Average price range is required'),
});

const TailorSignupScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSignup = async (values) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        shopName: values.shopName,
        shopLocation: values.shopLocation,
        averagePriceRange: values.averagePriceRange,
      };
      
      const response = await tailorSignup(userData);
      setRegisteredEmail(values.email);
      navigation.navigate('OtpVerification', { email: values.email, userType: 'tailor' });
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Logo />
        
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1506152983158-b4a74a01c721' }}
          style={styles.backgroundImage}
        />
        
        <Text style={styles.title}>Tailor Signup</Text>
        <Text style={styles.subtitle}>Create your tailor account</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            shopName: '',
            shopLocation: '',
            averagePriceRange: '',
          }}
          validationSchema={tailorSignupSchema}
          onSubmit={handleSignup}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <>
              <FormInput
                placeholder="Full Name"
                onChangeText={handleChange('fullName')}
                onBlur={handleBlur('fullName')}
                value={values.fullName}
                error={touched.fullName && errors.fullName}
              />
              
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
              
              <FormInput
                placeholder="Confirm Password"
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                value={values.confirmPassword}
                secureTextEntry
                error={touched.confirmPassword && errors.confirmPassword}
              />
              
              <FormInput
                placeholder="Shop Name"
                onChangeText={handleChange('shopName')}
                onBlur={handleBlur('shopName')}
                value={values.shopName}
                error={touched.shopName && errors.shopName}
              />
              
              <FormInput
                placeholder="Shop Location"
                onChangeText={handleChange('shopLocation')}
                onBlur={handleBlur('shopLocation')}
                value={values.shopLocation}
                error={touched.shopLocation && errors.shopLocation}
              />
              
              <FormInput
                placeholder="Average Price Range (e.g., $50-$200)"
                onChangeText={handleChange('averagePriceRange')}
                onBlur={handleBlur('averagePriceRange')}
                value={values.averagePriceRange}
                error={touched.averagePriceRange && errors.averagePriceRange}
              />
              
              <FormButton title="Sign Up" onPress={handleSubmit} />
            </>
          )}
        </Formik>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text 
              style={styles.loginText}
              onPress={() => navigation.navigate('Login')}
            >
              Login
            </Text>
          </Text>
        </View>
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
    paddingBottom: SIZES.padding * 3,
  },
  backgroundImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginVertical: 20,
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
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
  },
  footerText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  loginText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default TailorSignupScreen;
