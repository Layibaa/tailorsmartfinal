import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const AdminLoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required'),
  password: Yup.string()
    .required('Password is required')
});

const AdminLoginForm = ({ onSubmit, isLoading, error }) => {
  // Hardcoded admin credentials
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin123';

  const handleAdminLogin = (values) => {
    // Validate against hardcoded credentials
    if (values.username === ADMIN_USERNAME && values.password === ADMIN_PASSWORD) {
      // Create mock admin user data
      const adminData = {
        user: {
          _id: 'admin-123',
          name: 'Admin',
          email: 'admin@tailoringapp.com',
          role: 'admin'
        },
        token: 'admin-token-123456',
        success: true
      };
      onSubmit(adminData);
    } else {
      onSubmit({ success: false, error: 'Invalid admin credentials' });
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Formik
        initialValues={{ username: '', password: '' }}
        validationSchema={AdminLoginSchema}
        onSubmit={handleAdminLogin}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Input
              placeholder="Admin Username"
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              autoCapitalize="none"
              error={touched.username && errors.username}
              iconName="user"
            />
            
            <Input
              placeholder="Admin Password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              secureTextEntry
              error={touched.password && errors.password}
              iconName="lock"
            />
            
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Button title="Admin Login" onPress={handleSubmit} />
            )}
          </View>
        )}
      </Formik>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20
  },
  formContainer: {
    width: '100%'
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: 10
  }
});

export default AdminLoginForm;