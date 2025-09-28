import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import LocationPicker from '../../components/forms/LocationPicker'; // NEW
import colors from '../../styles/colors';

// Updated validation schema with location
const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  city: Yup.string().required('City is required'),
  region: Yup.string().when('city', {
    is: 'Islamabad',
    then: Yup.string().required('Region is required for Islamabad'),
    otherwise: Yup.string().nullable()
  }),
  shopName: Yup.string().required('Shop name is required'),
  shopLocation: Yup.string().required('Shop address is required'),
  averagePrice: Yup.number().required('Average price is required'),
  password: Yup.string().when('$isEditing', {
    is: true,
    then: Yup.string().min(6, 'Password must be at least 6 characters').required('Password required to save changes'),
    otherwise: Yup.string()
  })
});

const TailorProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (values) => {
    try {
      // Prepare the update data
      const updateData = {
        name: values.name,
        city: values.city,
        region: values.region || null, // Set to null for non-Islamabad cities
        // Update tailor profile
        shopName: values.shopName,
        shopAddress: values.shopLocation, // Map to shopAddress in tailorProfile
        averagePrice: parseFloat(values.averagePrice),
        password: values.password // For verification
      };

      console.log('Updating tailor profile with:', updateData);
      
      const result = await updateProfile(updateData);
      
      if (result.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: logout,
        },
      ]
    );
  };

  // Get location display text
  const getLocationText = () => {
    if (user.city === 'Islamabad' && user.region) {
      return `${user.region}, ${user.city}`;
    }
    return user.city || 'Not specified';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Tailor Account</Text>
      </View>

      {/* Display current location when not editing */}
      {!isEditing && (
        <View style={styles.locationDisplay}>
          <Text style={styles.locationLabel}>Current Location:</Text>
          <Text style={styles.locationText}>{getLocationText()}</Text>
        </View>
      )}

      <Formik
        initialValues={{
          name: user.name || '',
          city: user.city || '',
          region: user.region || '',
          shopName: user.tailorProfile?.shopName || '',
          shopLocation: user.tailorProfile?.shopLocation || user.tailorProfile?.shopAddress || '',
          averagePrice: user.tailorProfile?.averagePrice?.toString() || '',
          password: ''
        }}
        validationSchema={ProfileSchema}
        context={{ isEditing }}
        onSubmit={handleUpdate}
        enableReinitialize={true}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <Input
              placeholder="Name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name && errors.name}
              editable={isEditing}
              iconName="user"
            />

            {/* Location Section - Only show when editing */}
            {isEditing && (
              <>
                <Text style={styles.sectionTitle}>Location</Text>
                <LocationPicker
                  city={values.city}
                  region={values.region}
                  onCityChange={(city) => setFieldValue('city', city)}
                  onRegionChange={(region) => setFieldValue('region', region)}
                  errors={errors}
                  touched={touched}
                />
              </>
            )}

            <Text style={styles.sectionTitle}>Shop Information</Text>
            
            <Input
              placeholder="Shop Name"
              value={values.shopName}
              onChangeText={handleChange('shopName')}
              onBlur={handleBlur('shopName')}
              error={touched.shopName && errors.shopName}
              editable={isEditing}
              iconName="shopping-bag"
            />
            
            <Input
              placeholder="Shop Address"
              value={values.shopLocation}
              onChangeText={handleChange('shopLocation')}
              onBlur={handleBlur('shopLocation')}
              error={touched.shopLocation && errors.shopLocation}
              editable={isEditing}
              iconName="map-pin"
              multiline={isEditing}
              numberOfLines={isEditing ? 3 : 1}
              textAlignVertical={isEditing ? "top" : "center"}
            />
            
            <Input
              placeholder="Average Price (PKR)"
              value={values.averagePrice}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setFieldValue('averagePrice', numericValue);
              }}
              onBlur={handleBlur('averagePrice')}
              keyboardType="numeric"
              error={touched.averagePrice && errors.averagePrice}
              editable={isEditing}
              iconName="dollar-sign"
            />

            {isEditing && (
              <Input
                placeholder="Enter password to confirm changes"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                secureTextEntry
                error={touched.password && errors.password}
                iconName="lock"
              />
            )}

            {isEditing ? (
              <View style={styles.buttonContainer}>
                <Button 
                  title="Save Changes" 
                  onPress={handleSubmit}
                  style={styles.saveButton}
                />
                <Button 
                  title="Cancel" 
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelButton}
                />
              </View>
            ) : (
              <Button 
                title="Edit Profile" 
                onPress={() => setIsEditing(true)}
                style={styles.editButton}
              />
            )}
          </View>
        )}
      </Formik>

      <View style={styles.actionButtons}>
        <Button 
          title="Logout" 
          onPress={handleLogout}
          style={styles.logoutButton} 
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray
  },
  locationDisplay: {
    padding: 20,
    backgroundColor: colors.lightGray,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 8
  },
  locationLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 5
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  formContainer: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 15,
    marginTop: 10
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10
  },
  saveButton: {
    backgroundColor: colors.primary || colors.black
  },
  cancelButton: {
    backgroundColor: colors.gray
  },
  editButton: {
    backgroundColor: colors.primary || colors.black,
    marginTop: 20
  },
  actionButtons: {
    padding: 20,
    marginTop: 20
  },
  logoutButton: {
    backgroundColor: colors.error || '#dc3545',
    marginBottom: 20
  }
});

export default TailorProfileScreen;