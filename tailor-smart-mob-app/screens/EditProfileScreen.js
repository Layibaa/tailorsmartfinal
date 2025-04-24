import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, Alert } from 'react-native';
import Header from '../components/Header';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import { theme } from '../utils/theme';
import { AuthContext } from '../services/auth';
import { updateUserProfile, updateTailorProfile } from '../services/api';
import { validatePhone, validateName, validateEmail } from '../utils/validation';

const EditProfileScreen = ({ navigation, route }) => {
  const { authState } = useContext(AuthContext);
  const isTailor = authState.user?.role === 'tailor';
  const [loading, setLoading] = useState(false);
  
  // User profile fields
  const [name, setName] = useState(authState.user?.name || '');
  const [email, setEmail] = useState(authState.user?.email || '');
  const [phone, setPhone] = useState(authState.user?.phone || '');
  
  // Customer-specific fields
  const [gender, setGender] = useState(authState.user?.gender || '');
  const [age, setAge] = useState(authState.user?.age?.toString() || '');
  const [height, setHeight] = useState(authState.user?.height?.toString() || '');
  const [weight, setWeight] = useState(authState.user?.weight?.toString() || '');
  
  // Tailor-specific fields
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');
  
  // Form validation errors
  const [errors, setErrors] = useState({});

  // Load tailor profile data if the user is a tailor
  useEffect(() => {
    if (isTailor) {
      const loadTailorProfile = async () => {
        try {
          const profile = await fetchTailorProfile(authState.user?._id);
          setShopName(profile.shopName || '');
          setLocation(profile.location || '');
          setPriceRange(profile.priceRange || '');
        } catch (error) {
          console.error('Error loading tailor profile:', error);
        }
      };
      
      loadTailorProfile();
    }
  }, [isTailor, authState.user?._id]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!validateName(name)) newErrors.name = 'Please enter a valid name';
    if (!validateEmail(email)) newErrors.email = 'Please enter a valid email';
    if (phone && !validatePhone(phone)) newErrors.phone = 'Please enter a valid phone number';
    
    if (isTailor) {
      if (!shopName.trim()) newErrors.shopName = 'Shop name is required';
      if (!location.trim()) newErrors.location = 'Location is required';
      if (!priceRange.trim()) newErrors.priceRange = 'Price range is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Update user profile
      const userData = {
        name,
        email,
        phone,
      };
      
      // Add customer-specific fields
      if (!isTailor) {
        userData.gender = gender;
        userData.age = age ? parseInt(age, 10) : null;
        userData.height = height ? parseFloat(height) : null;
        userData.weight = weight ? parseFloat(weight) : null;
      }
      
      await updateUserProfile(userData);
      
      // Update tailor profile if tailor
      if (isTailor) {
        await updateTailorProfile({
          shopName,
          location,
          priceRange
        });
      }
      
      // Navigate back to profile screen
      navigation.goBack();
      
      // Show success message
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Edit Profile"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <FormInput
          label="Full Name"
          value={name}
          onChangeText={setName}
          icon="person-outline"
          placeholder="Enter your full name"
          error={errors.name}
          autoCapitalize="words"
        />
        
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
          placeholder="Enter your email"
          error={errors.email}
          keyboardType="email-address"
        />
        
        <FormInput
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          placeholder="Enter your phone number"
          error={errors.phone}
          keyboardType="phone-pad"
        />
        
        {isTailor ? (
          <>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            
            <FormInput
              label="Shop Name"
              value={shopName}
              onChangeText={setShopName}
              icon="business-outline"
              placeholder="Enter your shop name"
              error={errors.shopName}
              autoCapitalize="words"
            />
            
            <FormInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              icon="location-outline"
              placeholder="Enter your shop location"
              error={errors.location}
              autoCapitalize="words"
            />
            
            <FormInput
              label="Price Range"
              value={priceRange}
              onChangeText={setPriceRange}
              icon="pricetag-outline"
              placeholder="e.g. $50-$200"
              error={errors.priceRange}
            />
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Measurement Information</Text>
            
            <FormInput
              label="Gender"
              value={gender}
              onChangeText={setGender}
              icon="transgender-outline"
              placeholder="Enter your gender"
              autoCapitalize="words"
            />
            
            <FormInput
              label="Age"
              value={age}
              onChangeText={setAge}
              icon="calendar-outline"
              placeholder="Enter your age"
              keyboardType="number-pad"
            />
            
            <FormInput
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              icon="resize-outline"
              placeholder="Enter your height in cm"
              keyboardType="decimal-pad"
            />
            
            <FormInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              icon="scale-outline"
              placeholder="Enter your weight in kg"
              keyboardType="decimal-pad"
            />
          </>
        )}
        
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          style={styles.button}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 24,
    marginBottom: 16,
  },
  button: {
    marginTop: 32,
  },
});

export default EditProfileScreen;