import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { 
  getTailorProfile, 
  updateTailorProfile, 
  sendTailorPasswordChangeOtp,
  updateTailorPassword,
  sendTailorDeleteAccountOtp,
  deleteTailorAccount,
  getLocationOptions
} from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors'; 
import { CommonActions } from '@react-navigation/native';
import TailorReviewsSection from '../../components/TailorReviewsSection';

// Validation schemas
const ProfileSchema = Yup.object().shape({
  name: Yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  city: Yup.string().required('City is required'),
  region: Yup.string().when('city', {
    is: 'Islamabad',
    then: Yup.string().required('Region is required for Islamabad'),
    otherwise: Yup.string().nullable()
  }),
  shopName: Yup.string().required('Shop name is required'),
  shopLocation: Yup.string().required('Shop address is required'),
  averagePrice: Yup.number().positive('Price must be positive').required('Average price is required')
});

const PasswordSchema = Yup.object().shape({
  newPassword: Yup.string().min(6, 'Password must be at least 6 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm password is required'),
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required')
});

const OtpSchema = Yup.object().shape({
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required')
});

const TailorProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1); // 1: send OTP, 2: change password
  const [deleteStep, setDeleteStep] = useState(1); // 1: send OTP, 2: confirm delete
  const [locationOptions, setLocationOptions] = useState({
    cities: [],
    islamabadRegions: []
  });

  useEffect(() => {
    loadProfile();
    loadLocationOptions();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await getTailorProfile();
      setProfile(response.tailor);
    } catch (error) {
      console.error('Load profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocationOptions = async () => {
    try {
      const response = await getLocationOptions();
      setLocationOptions(response.locations);
    } catch (error) {
      console.error('Failed to load location options:', error);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setIsUpdating(true);
      const updateData = {
        name: values.name,
        email: values.email,
        city: values.city,
        region: values.city === 'Islamabad' ? values.region : null,
        shopName: values.shopName,
        shopLocation: values.shopLocation,
        averagePrice: parseFloat(values.averagePrice)
      };

      const response = await updateTailorProfile(updateData);
      setProfile(response.tailor);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    try {
      await sendTailorPasswordChangeOtp();
      setPasswordStep(2);
      Alert.alert('Success', 'OTP sent to your email');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleUpdatePassword = async (values) => {
    try {
      await updateTailorPassword({
        otp: values.otp,
        newPassword: values.newPassword
      });
      setShowPasswordModal(false);
      setPasswordStep(1);
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password');
    }
  };

  const handleSendDeleteOtp = async () => {
    try {
      await sendTailorDeleteAccountOtp();
      setDeleteStep(2);
      Alert.alert('Success', 'OTP sent to your email for account deletion');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
    }
  };


  const handleDeleteAccount = async (values) => {
    try {
      await deleteTailorAccount({ otp: values.otp });
      setShowDeleteModal(false);
      Alert.alert('Account Deleted', 'Your account has been deleted successfully', [
        { text: 'OK', onPress: () => logout() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading profile..." />;
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={48} color={colors.error || '#dc3545'} />
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button title="Retry" onPress={loadProfile} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : null}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <Formik
          initialValues={{
            name: profile.name || '',
            email: profile.email || '',
            city: profile.city || '',
            region: profile.region || '',
            shopName: profile.tailorProfile?.shopName || '',
            shopLocation: profile.tailorProfile?.shopLocation || '',
            averagePrice: profile.tailorProfile?.averagePrice?.toString() || ''
          }}
          validationSchema={ProfileSchema}
          onSubmit={handleUpdateProfile}
          enableReinitialize
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                error={touched.name && errors.name}
                iconName="user"
              />

              <Input
                label="Email"
                placeholder="Enter your email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                error={touched.email && errors.email}
                iconName="mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.sectionTitle}>Location</Text>
              
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>City</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={values.city}
                    onValueChange={(value) => {
                      setFieldValue('city', value);
                      if (value !== 'Islamabad') {
                        setFieldValue('region', '');
                      }
                    }}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select City" value="" />
                    {locationOptions.cities.map(city => (
                      <Picker.Item key={city} label={city} value={city} />
                    ))}
                  </Picker>
                </View>
                {touched.city && errors.city && (
                  <Text style={styles.errorText}>{errors.city}</Text>
                )}
              </View>

              {values.city === 'Islamabad' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.label}>Region</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={values.region}
                      onValueChange={(value) => setFieldValue('region', value)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Region" value="" />
                      {locationOptions.islamabadRegions.map(region => (
                        <Picker.Item key={region} label={region} value={region} />
                      ))}
                    </Picker>
                  </View>
                  {touched.region && errors.region && (
                    <Text style={styles.errorText}>{errors.region}</Text>
                  )}
                </View>
              )}

              <Text style={styles.sectionTitle}>Shop Information</Text>
              
              <Input
                label="Shop Name"
                placeholder="Enter your shop name"
                value={values.shopName}
                onChangeText={handleChange('shopName')}
                onBlur={handleBlur('shopName')}
                error={touched.shopName && errors.shopName}
                iconName="shopping-bag"
              />
              
              <Input
                label="Shop Address"
                placeholder="Enter your shop address"
                value={values.shopLocation}
                onChangeText={handleChange('shopLocation')}
                onBlur={handleBlur('shopLocation')}
                error={touched.shopLocation && errors.shopLocation}
                iconName="map-pin"
                multiline
                numberOfLines={3}
              />
              
              <Input
                label="Average Price (PKR)"
                placeholder="Enter average price"
                value={values.averagePrice}
                onChangeText={(text) => {
                  const numericValue = text.replace(/[^0-9]/g, '');
                  setFieldValue('averagePrice', numericValue);
                }}
                onBlur={handleBlur('averagePrice')}
                keyboardType="numeric"
                error={touched.averagePrice && errors.averagePrice}
                iconName="PKR"
              />

              {isUpdating ? (
                <LoadingSpinner />
              ) : (
                <Button title="Update Profile" onPress={handleSubmit} />
              )}
            </View>
          )}
        </Formik>

<TailorReviewsSection tailorId={user.id} />

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Feather name="lock" size={20} color={colors.white} />
            <Text style={styles.changePasswordText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Feather name="trash-2" size={20} color={colors.white} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordStep(1);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => {
                setShowPasswordModal(false);
                setPasswordStep(1);
              }}
            >
              <Feather name="x" size={24} color={colors.black} />
            </TouchableOpacity>
          </View>

          {passwordStep === 1 ? (
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>
                We'll send an OTP to your email address to verify the password change.
              </Text>
              <Button title="Send OTP" onPress={handleSendPasswordOtp} />
            </View>
          ) : (
            <Formik
              initialValues={{
                newPassword: '',
                confirmPassword: '',
                otp: ''
              }}
              validationSchema={PasswordSchema}
              onSubmit={handleUpdatePassword}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.modalContent}>
                  <Text style={styles.modalText}>
                    Enter the OTP sent to your email and your new password.
                  </Text>

                  <Input
                    label="OTP"
                    placeholder="Enter 6-digit OTP"
                    value={values.otp}
                    onChangeText={handleChange('otp')}
                    onBlur={handleBlur('otp')}
                    keyboardType="numeric"
                    maxLength={6}
                    error={touched.otp && errors.otp}
                    iconName="shield"
                  />

                  <Input
                    label="New Password"
                    placeholder="Enter new password"
                    value={values.newPassword}
                    onChangeText={handleChange('newPassword')}
                    onBlur={handleBlur('newPassword')}
                    secureTextEntry
                    error={touched.newPassword && errors.newPassword}
                    iconName="lock"
                  />

                  <Input
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    secureTextEntry
                    error={touched.confirmPassword && errors.confirmPassword}
                    iconName="lock"
                  />

                  <Button title="Change Password" onPress={handleSubmit} />
                </View>
              )}
            </Formik>
          )}
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="slide"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setDeleteStep(1);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <TouchableOpacity
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteStep(1);
              }}
            >
              <Feather name="x" size={24} color={colors.black} />
            </TouchableOpacity>
          </View>

          {deleteStep === 1 ? (
            <View style={styles.modalContent}>
              <View style={styles.warningContainer}>
                <Feather name="alert-triangle" size={48} color={colors.error} />
                <Text style={styles.warningTitle}>Are you sure?</Text>
                <Text style={styles.warningText}>
                  This action cannot be undone. All your data including orders, messages, and profile information will be permanently deleted.
                </Text>
              </View>
              <Button 
                title="Send Verification OTP" 
                onPress={handleSendDeleteOtp}
                buttonStyle={styles.deleteButton}
              />
              <Button 
                title="Cancel" 
                onPress={() => setShowDeleteModal(false)}
                buttonStyle={styles.cancelButton}
                textStyle={styles.cancelButtonText}
              />
            </View>
          ) : (
            <Formik
              initialValues={{ otp: '' }}
              validationSchema={OtpSchema}
              onSubmit={handleDeleteAccount}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.modalContent}>
                  <View style={styles.warningContainer}>
                    <Feather name="alert-triangle" size={48} color={colors.error} />
                    <Text style={styles.warningTitle}>Final Confirmation</Text>
                    <Text style={styles.warningText}>
                      Enter the OTP sent to your email to permanently delete your account.
                    </Text>
                  </View>

                  <Input
                    label="OTP"
                    placeholder="Enter 6-digit OTP"
                    value={values.otp}
                    onChangeText={handleChange('otp')}
                    onBlur={handleBlur('otp')}
                    keyboardType="numeric"
                    maxLength={6}
                    error={touched.otp && errors.otp}
                    iconName="shield"
                  />

                  <Button 
                    title="Delete My Account" 
                    onPress={handleSubmit}
                    buttonStyle={styles.deleteButton}
                  />
                  <Button 
                    title="Cancel" 
                    onPress={() => {
                      setShowDeleteModal(false);
                      setDeleteStep(1);
                    }}
                    buttonStyle={styles.cancelButton}
                    textStyle={styles.cancelButtonText}
                  />
                </View>
              )}
            </Formik>
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: colors.white
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  placeholder: {
    width: 40
  },
  formContainer: {
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16,
    marginTop: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  pickerContainer: {
    marginBottom: 16
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    backgroundColor: colors.white
  },
  picker: {
    height: 50
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4
  },
  actionButtons: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12
  },
  changePasswordButton: {
    backgroundColor: colors.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8
  },
  changePasswordText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: colors.error || '#dc3545',
    marginVertical: 20,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  modalText: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22
  },
  warningContainer: {
    alignItems: 'center',
    marginBottom: 32
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.error,
    marginTop: 16,
    marginBottom: 12
  },
  warningText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.lightGray,
    marginTop: 12
  },
  cancelButtonText: {
    color: colors.black
  }
});

export default TailorProfileScreen;