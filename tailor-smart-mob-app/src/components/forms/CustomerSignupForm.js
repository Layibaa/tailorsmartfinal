import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import colors from '../../styles/colors';

const CustomerSignupSchema = Yup.object().shape({
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
  age: Yup.number()
    .min(16, 'You must be at least 16 years old')
    .max(100, 'Age cannot exceed 100')
    .required('Age is required'),
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Please select a valid gender')
    .required('Gender is required'),
  weight: Yup.number()
    .min(30, 'Weight must be at least 30kg')
    .max(250, 'Weight cannot exceed 250kg')
    .required('Weight is required'),
  height: Yup.number()
    .min(100, 'Height must be at least 100cm')
    .max(250, 'Height cannot exceed 250cm')
    .required('Height is required')
});

const CustomerSignupForm = ({ onSubmit, isLoading }) => {
  return (
    <Formik
      initialValues={{ 
        name: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        age: '',
        gender: 'male',
        weight: '',
        height: ''
      }}
      validationSchema={CustomerSignupSchema}
      onSubmit={onSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
        <View style={styles.formContainer}>
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
          
          <Input
            placeholder="Age"
            value={values.age}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setFieldValue('age', numericValue);
            }}
            onBlur={handleBlur('age')}
            keyboardType="numeric"
            error={touched.age && errors.age}
            iconName="calendar"
          />
          
          <Text style={styles.sectionTitle}>Gender</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                values.gender === 'male' && styles.radioButtonSelected
              ]}
              onPress={() => setFieldValue('gender', 'male')}
            >
              <Text
                style={[
                  styles.radioText,
                  values.gender === 'male' && styles.radioTextSelected
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.radioButton,
                values.gender === 'female' && styles.radioButtonSelected
              ]}
              onPress={() => setFieldValue('gender', 'female')}
            >
              <Text
                style={[
                  styles.radioText,
                  values.gender === 'female' && styles.radioTextSelected
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.radioButton,
                values.gender === 'other' && styles.radioButtonSelected
              ]}
              onPress={() => setFieldValue('gender', 'other')}
            >
              <Text
                style={[
                  styles.radioText,
                  values.gender === 'other' && styles.radioTextSelected
                ]}
              >
                Other
              </Text>
            </TouchableOpacity>
          </View>
          {touched.gender && errors.gender && (
            <Text style={styles.errorText}>{errors.gender}</Text>
          )}
          
          <Input
            placeholder="Weight (kg)"
            value={values.weight}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setFieldValue('weight', numericValue);
            }}
            onBlur={handleBlur('weight')}
            keyboardType="numeric"
            error={touched.weight && errors.weight}
            iconName="activity"
          />
          
          <Input
            placeholder="Height (cm)"
            value={values.height}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setFieldValue('height', numericValue);
            }}
            onBlur={handleBlur('height')}
            keyboardType="numeric"
            error={touched.height && errors.height}
            iconName="arrow-up"
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 10
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  radioButton: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center'
  },
  radioButtonSelected: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  radioText: {
    color: colors.black
  },
  radioTextSelected: {
    color: colors.white
  },
  errorText: {
    color: colors.error,
    marginBottom: 15
  }
});

export default CustomerSignupForm;
