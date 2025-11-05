// components/ProfileCompletionModal.js
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import Input from './ui/Input';
import Button from './ui/Button';
import colors from '../styles/colors';
import { updateCustomerProfile } from '../services/api';

const ProfileSchema = Yup.object().shape({
  age: Yup.number()
    .min(16, 'Age must be at least 16')
    .max(100, 'Age must be less than 100')
    .required('Age is required'),
  gender: Yup.string()
    .oneOf(['male', 'female'], 'Please select a valid gender')
    .required('Gender is required'),
  height: Yup.number()
    .min(140, 'Height must be at least 140cm')
    .max(220, 'Height must be less than 220cm')
    .required('Height is required'),
  weight: Yup.number()
    .min(30, 'Weight must be at least 30kg')
    .max(200, 'Weight must be less than 200kg')
    .required('Weight is required')
});

const ProfileCompletionModal = ({ visible, onClose, onComplete, existingProfile = {} }) => {
  const [loading, setLoading] = useState(false);

  const initialValues = {
    age: existingProfile.age?.toString() || '',
    gender: existingProfile.gender || '',
    height: existingProfile.height?.toString() || '',
    weight: existingProfile.weight?.toString() || ''
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const profileData = {
        age: parseInt(values.age),
        gender: values.gender,
        height: parseFloat(values.height),
        weight: parseFloat(values.weight)
      };

      await updateCustomerProfile(profileData);
      
      Alert.alert(
        'Success',
        'Profile updated successfully! You can now use AI autofill.',
        [{ text: 'OK', onPress: () => {
          onComplete?.(profileData);
          onClose();
        }}]
      );
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.msg || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={colors.gray} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Please provide these details to enable AI-powered measurement predictions
          </Text>

          <Formik
            initialValues={initialValues}
            validationSchema={ProfileSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View style={styles.form}>
                <Input
                  label="Age"
                  placeholder="Enter your age"
                  value={values.age}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9]/g, '');
                    handleChange('age')(sanitized);
                  }}
                  onBlur={handleBlur('age')}
                  keyboardType="numeric"
                  error={touched.age && errors.age}
                  iconName="calendar"
                />

                <View style={styles.genderContainer}>
                  <Text style={styles.genderLabel}>Gender</Text>
                  <View style={styles.genderButtons}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        values.gender === 'male' && styles.genderButtonActive
                      ]}
                      onPress={() => setFieldValue('gender', 'male')}
                    >
                      <Text style={[
                        styles.genderButtonText,
                        values.gender === 'male' && styles.genderButtonTextActive
                      ]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        values.gender === 'female' && styles.genderButtonActive
                      ]}
                      onPress={() => setFieldValue('gender', 'female')}
                    >
                      <Text style={[
                        styles.genderButtonText,
                        values.gender === 'female' && styles.genderButtonTextActive
                      ]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {touched.gender && errors.gender && (
                    <Text style={styles.errorText}>{errors.gender}</Text>
                  )}
                </View>

                <Input
                  label="Height (cm)"
                  placeholder="Enter your height in centimeters"
                  value={values.height}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    handleChange('height')(sanitized);
                  }}
                  onBlur={handleBlur('height')}
                  keyboardType="numeric"
                  error={touched.height && errors.height}
                  iconName="trending-up"
                />

                <Input
                  label="Weight (kg)"
                  placeholder="Enter your weight in kilograms"
                  value={values.weight}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    handleChange('weight')(sanitized);
                  }}
                  onBlur={handleBlur('weight')}
                  keyboardType="numeric"
                  error={touched.weight && errors.weight}
                  iconName="activity"
                />

                <View style={styles.buttonContainer}>
                  <Button
                    title="Save Profile"
                    onPress={handleSubmit}
                    loading={loading}
                  />
                  <Button
                    title="Skip for Now"
                    onPress={onClose}
                    outline
                    buttonStyle={styles.skipButton}
                  />
                </View>
              </View>
            )}
          </Formik>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black
  },
  closeButton: {
    padding: 8
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 30,
    lineHeight: 22
  },
  form: {
    flex: 1
  },
  genderContainer: {
    marginBottom: 20
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightGray,
    alignItems: 'center',
    backgroundColor: colors.white
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  genderButtonText: {
    fontSize: 16,
    color: colors.gray
  },
  genderButtonTextActive: {
    color: colors.white,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4
  },
  buttonContainer: {
    marginTop: 20,
    paddingBottom: 20
  },
  skipButton: {
    marginTop: 12
  }
});

export default ProfileCompletionModal;