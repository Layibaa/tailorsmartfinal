import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import LocationPicker from './LocationPicker'; // NEW
import colors from '../../styles/colors';

// Updated validation schema with location
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
  city: Yup.string()
    .required('City is required'),
  region: Yup.string()
    .when('city', {
      is: 'Islamabad',
      then: Yup.string().required('Region is required for Islamabad'),
      otherwise: Yup.string().nullable()
    }),
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

const TailorSignupForm = ({ onSubmit, isLoading }) => {
  return (
    <Formik
      initialValues={{ 
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        city: '',        // NEW
        region: '',      // NEW
        shopName: '',
        shopLocation: '',
        averagePrice: ''
      }}
      validationSchema={TailorSignupSchema}
      onSubmit={onSubmit}
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

          {/* NEW: Location Section */}
          <Text style={styles.sectionTitle}>Location</Text>
          <LocationPicker
            city={values.city}
            region={values.region}
            onCityChange={(city) => setFieldValue('city', city)}
            onRegionChange={(region) => setFieldValue('region', region)}
            errors={errors}
            touched={touched}
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
            placeholder="Shop Address (Detailed location)"
            value={values.shopLocation}
            onChangeText={handleChange('shopLocation')}
            onBlur={handleBlur('shopLocation')}
            error={touched.shopLocation && errors.shopLocation}
            iconName="map-pin"
            multiline
            numberOfLines={2}
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
        </View>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 15,
    marginTop: 10
  }
});

export default TailorSignupForm;