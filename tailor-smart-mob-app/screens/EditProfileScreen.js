import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';

const EditProfileScreen = ({ navigation }) => {
  // In a real app, this would come from your authentication state
  const [fullName, setFullName] = useState('John Doe');
  const [phone, setPhone] = useState('+1 234 567 8900');
  const [email, setEmail] = useState('john.doe@example.com');
  const [address, setAddress] = useState('123 Main St, Anytown, USA');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!phone) newErrors.phone = 'Phone number is required';
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!address) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      // In a real app, you would update the user profile here
      navigation.navigate('Profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: 'https://tryeasel.dev/placeholder.svg?width=100&height=100' }}
            style={styles.avatar}
            alt="User Avatar"
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <MaterialIcons name="camera-alt" size={20} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.formContainer}>
          <CustomInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            icon="person"
            error={errors.fullName}
          />
          
          <CustomInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            icon="phone"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          
          <CustomInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon="email"
            keyboardType="email-address"
            error={errors.email}
          />
          
          <CustomInput
            label="Address"
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            icon="location-on"
            multiline
            numberOfLines={3}
            error={errors.address}
          />
          
          <View style={styles.buttonContainer}>
            <CustomButton
              title="Save Changes"
              variant="primary"
              color="#AEDFF7"
              onPress={handleSave}
            />
            
            <CustomButton
              title="Cancel"
              variant="outline"
              color="black"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  placeholder: {
    width: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: '#AEDFF7',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  formContainer: {
    width: '100%',
  },
  buttonContainer: {
    marginTop: 20,
  },
});

export default EditProfileScreen;