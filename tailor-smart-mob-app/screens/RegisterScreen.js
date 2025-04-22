import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import RoleToggle from '../components/RoleToggle';

const RegisterScreen = ({ navigation }) => {
  const [role, setRole] = useState('customer');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!phone) newErrors.phone = 'Phone number is required';
    
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!address) newErrors.address = 'Address is required';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (validate()) {
      // In a real app, you would handle registration here
      navigation.navigate('Profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>
        
        <View style={styles.formContainer}>
          <RoleToggle
            selectedRole={role}
            onRoleChange={setRole}
          />
          
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
          
          <CustomInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            icon="lock"
            secureTextEntry
            error={errors.password}
          />
          
          <CustomInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            icon="lock"
            secureTextEntry
            error={errors.confirmPassword}
          />
          
          <CustomButton
            title="Create Account"
            variant="secondary"
            color="#D4AF37"
            onPress={handleRegister}
          />
          
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms & Conditions
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
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
  backButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  formContainer: {
    width: '100%',
  },
  termsText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  loginText: {
    fontFamily: 'Poppins_500Medium',
    color: '#AEDFF7',
  },
});

export default RegisterScreen;