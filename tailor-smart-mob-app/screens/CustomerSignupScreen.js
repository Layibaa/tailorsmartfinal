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
import { customerSignup } from '../api/authApi';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

// Validation schema for customer signup
const customerSignupSchema = Yup.object().shape({
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
  gender: Yup.string()
    .required('Gender is required'),
  age: Yup.number()
    .positive('Age must be positive')
    .integer('Age must be a whole number')
    .required('Age is required'),
  height: Yup.number()
    .positive('Height must be positive')
    .required('Height is required'),
  weight: Yup.number()
    .positive('Weight must be positive')
    .required('Weight is required'),
});

const CustomerSignupScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignup = async (values) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        gender: values.gender,
        age: Number(values.age),
        height: Number(values.height),
        weight: Number(values.weight),
      };
      
      const response = await customerSignup(userData);
      navigation.navigate('OtpVerification', { email: values.email, userType: 'customer' });
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
          source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d' }}
          style={styles.backgroundImage}
        />
        
        <Text style={styles.title}>Customer Signup</Text>
        <Text style={styles.subtitle}>Create your customer account</Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            gender: '',
            age: '',
            height: '',
            weight: '',
          }}
          validationSchema={customerSignupSchema}
          onSubmit={handleSignup}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
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
              
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      values.gender === 'male' && styles.selectedGender,
                    ]}
                    onPress={() => setFieldValue('gender', 'male')}
                  >
                    <Text style={[
                      styles.genderText,
                      values.gender === 'male' && styles.selectedGenderText,
                    ]}>Male</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      values.gender === 'female' && styles.selectedGender,
                    ]}
                    onPress={() => setFieldValue('gender', 'female')}
                  >
                    <Text style={[
                      styles.genderText,
                      values.gender === 'female' && styles.selectedGenderText,
                    ]}>Female</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      values.gender === 'other' && styles.selectedGender,
                    ]}
                    onPress={() => setFieldValue('gender', 'other')}
                  >
                    <Text style={[
                      styles.genderText,
                      values.gender === 'other' && styles.selectedGenderText,
                    ]}>Other</Text>
                  </TouchableOpacity>
                </View>
                
                {touched.gender && errors.gender && (
                  <Text style={styles.errorText}>{errors.gender}</Text>
                )}
              </View>
              
              <FormInput
                placeholder="Age"
                onChangeText={handleChange('age')}
                onBlur={handleBlur('age')}
                value={values.age}
                keyboardType="numeric"
                error={touched.age && errors.age}
              />
              
              <FormInput
                placeholder="Height (cm)"
                onChangeText={handleChange('height')}
                onBlur={handleBlur('height')}
                value={values.height}
                keyboardType="numeric"
                error={touched.height && errors.height}
              />
              
              <FormInput
                placeholder="Weight (kg)"
                onChangeText={handleChange('weight')}
                onBlur={handleBlur('weight')}
                value={values.weight}
                keyboardType="numeric"
                error={touched.weight && errors.weight}
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
  genderContainer: {
    width: '100%',
    marginBottom: SIZES.padding,
  },
  genderLabel: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    padding: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedGender: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.lightBlue,
  },
  genderText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  selectedGenderText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default CustomerSignupScreen;
