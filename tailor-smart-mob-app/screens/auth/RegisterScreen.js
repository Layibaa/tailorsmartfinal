import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import colors from '../../utils/colors';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default role
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { signUp, loading } = useAuth();

  const validateForm = () => {
    let isValid = true;
    
    // Name validation
    if (!name) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    const userData = {
      name,
      email,
      password,
      role,
    };
    
    const result = await signUp(userData);
    
    if (!result.success) {
      Alert.alert('Registration Failed', result.error || 'There was an error during registration');
    }
  };

  const toggleRole = () => {
    setRole(role === 'customer' ? 'tailor' : 'customer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Register" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            autoCapitalize="words"
            error={nameError}
            icon={<Feather name="user" size={20} color={colors.gray} />}
          />
          
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
            icon={<Feather name="mail" size={20} color={colors.gray} />}
          />
          
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            error={passwordError}
            icon={<Feather name="lock" size={20} color={colors.gray} />}
          />
          
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            error={confirmPasswordError}
            icon={<Feather name="lock" size={20} color={colors.gray} />}
          />
          
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleToggle}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'customer' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('customer')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'customer' && styles.roleButtonTextActive,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'tailor' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('tailor')}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === 'tailor' && styles.roleButtonTextActive,
                  ]}
                >
                  Tailor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Button
            title="Register"
            onPress={handleRegister}
            style={styles.registerButton}
            loading={loading}
          />
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  form: {
    marginBottom: 24,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    marginBottom: 8,
    color: colors.black,
  },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    overflow: 'hidden',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
  },
  roleButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.gray,
  },
  roleButtonTextActive: {
    color: colors.white,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    marginRight: 4,
  },
  footerLink: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.primary,
  },
});

export default RegisterScreen;