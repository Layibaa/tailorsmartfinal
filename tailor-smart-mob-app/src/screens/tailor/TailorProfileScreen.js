
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from 'C:/Users/dell/Documents/GitHub/tailorsmartfinal/tailor-smart-mob-app/src/context/AuthContext.js';
import Button from 'C:/Users/dell/Documents/GitHub/tailorsmartfinal/tailor-smart-mob-app/src/components/ui/Button.js';
import Input from 'C:/Users/dell/Documents/GitHub/tailorsmartfinal/tailor-smart-mob-app/src/components/ui/Input.js';
import colors from 'C:/Users/dell/Documents/GitHub/tailorsmartfinal/tailor-smart-mob-app/src/styles/colors';

const ProfileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  shopName: Yup.string().required('Shop name is required'),
  shopLocation: Yup.string().required('Shop location is required'),
  averagePrice: Yup.number().required('Average price is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters')
});

const TailorProfileScreen = ({ navigation }) => {
  const { user, updateProfile, logout, deleteAccount } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (values) => {
    const result = await updateProfile(values);
    if (result.success) {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleDelete = async (password) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteAccount(password);
            if (result.success) {
              logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Formik
        initialValues={{
          name: user.name,
          shopName: user.tailorProfile?.shopName || '',
          shopLocation: user.tailorProfile?.shopLocation || '',
          averagePrice: user.tailorProfile?.averagePrice?.toString() || '',
          password: ''
        }}
        validationSchema={ProfileSchema}
        onSubmit={handleUpdate}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={styles.formContainer}>
            <Input
              placeholder="Name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={handleBlur('name')}
              error={touched.name && errors.name}
              editable={isEditing}
            />
            
            <Input
              placeholder="Shop Name"
              value={values.shopName}
              onChangeText={handleChange('shopName')}
              onBlur={handleBlur('shopName')}
              error={touched.shopName && errors.shopName}
              editable={isEditing}
            />
            
            <Input
              placeholder="Shop Location"
              value={values.shopLocation}
              onChangeText={handleChange('shopLocation')}
              onBlur={handleBlur('shopLocation')}
              error={touched.shopLocation && errors.shopLocation}
              editable={isEditing}
            />
            
            <Input
              placeholder="Average Price"
              value={values.averagePrice}
              onChangeText={handleChange('averagePrice')}
              onBlur={handleBlur('averagePrice')}
              keyboardType="numeric"
              error={touched.averagePrice && errors.averagePrice}
              editable={isEditing}
            />

            {isEditing && (
              <Input
                placeholder="Enter password to confirm changes"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={handleBlur('password')}
                secureTextEntry
                error={touched.password && errors.password}
              />
            )}

            {isEditing ? (
              <View style={styles.buttonContainer}>
                <Button title="Save Changes" onPress={handleSubmit} />
                <Button 
                  title="Cancel" 
                  onPress={() => setIsEditing(false)}
                  style={styles.secondaryButton}
                />
              </View>
            ) : (
              <Button title="Edit Profile" onPress={() => setIsEditing(true)} />
            )}
          </View>
        )}
      </Formik>

      <Button 
        title="Delete Account" 
        onPress={() => handleDelete(values.password)}
        style={styles.deleteButton} 
      />
      
      <Button 
        title="Logout" 
        onPress={logout}
        style={styles.logoutButton} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.white
  },
  formContainer: {
    flex: 1
  },
  buttonContainer: {
    gap: 10
  },
  secondaryButton: {
    backgroundColor: colors.gray
  },
  deleteButton: {
    backgroundColor: colors.error,
    marginBottom: 10
  },
  logoutButton: {
    backgroundColor: colors.black,
    marginBottom: 20
  }
});

export default TailorProfileScreen;
