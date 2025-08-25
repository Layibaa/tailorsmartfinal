import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const TailorSignupSchema = Yup.object().shape({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  shopName: Yup.string()
    .min(3, 'Shop name must be at least 3 characters')
    .required('Shop name is required'),
  shopLocation: Yup.string()
    .min(5, 'Shop location must be at least 5 characters')
    .required('Shop location is required'),
  averagePrice: Yup.number()
    .min(10, 'Average price must be at least 10')
    .required('Average price is required')
});

const TailorSignupScreen = ({ navigation }) => {
  const { register, isLoading } = useContext(AuthContext);
  const [error, setError] = useState(null);

  const handleSignup = async (values) => {
    setError(null);
    const userData = {
      name: values.name,
      email: values.email,
      password: values.password,
      role: 'tailor',
      tailorProfile: {
        shopName: values.shopName,
        shopLocation: values.shopLocation,
        averagePrice: values.averagePrice
      }
    };

    const result = await register(userData);
    
    if (result.success) {
      navigation.navigate('OtpVerification', { userId: result.userId });
    } else {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Tailor Registration</Text>
          <Text style={styles.subtitle}>Join our platform to connect with customers</Text>
           
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <Formik
          initialValues={{ 
            name: '', 
            email: '', 
            password: '', 
            confirmPassword: '',
            shopName: '',
            shopLocation: '',
            averagePrice: ''
          }}
          validationSchema={TailorSignupSchema}
          onSubmit={handleSignup}
        >
          {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <Input
                placeholder="Full Name"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
                iconName="user"
              />
              
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
              
              <Input
                placeholder="Confirm Password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                secureTextEntry
                error={touched.confirmPassword && errors.confirmPassword}
                iconName="check"
              />
              
              <Text style={styles.sectionTitle}>Shop Information</Text>
              
              <Input
                placeholder="Shop Name"
                value={values.shopName}
                onChangeText={handleChange('shopName')}
                onBlur={handleBlur('shopName')}
                error={touched.shopName && errors.shopName}
                iconName="shopping-bag"
              />
              
              <Input
                placeholder="Shop Location"
                value={values.shopLocation}
                onChangeText={handleChange('shopLocation')}
                onBlur={handleBlur('shopLocation')}
                error={touched.shopLocation && errors.shopLocation}
                iconName="map-pin"
              />
              
              <Input
                placeholder="Average Price ($)"
                value={values.averagePrice}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setFieldValue('averagePrice', numericValue);
                }}
                onBlur={handleBlur('averagePrice')}
                keyboardType="numeric"
                error={touched.averagePrice && errors.averagePrice}
                iconName="dollar-sign"
              />
              
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Button title="Sign Up" onPress={handleSubmit} />
              )}
              
              <TouchableOpacity 
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginText}>
                  Already have an account? Login
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
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
    padding: 20
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 20,
    textAlign: 'center'
  },
  headerImage: {
    width: '100%',
    height: 150,
    borderRadius: 8
  },
  formContainer: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 15,
    marginTop: 10
  },
  errorText: {
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center'
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center'
  },
  loginText: {
    color: colors.black,
    fontSize: 16
  }
});

export default TailorSignupScreen;
