import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SvgXml } from 'react-native-svg';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import { theme } from '../utils/theme';
import { AuthContext } from '../services/auth';
import { validateEmail, validateName, validatePassword, validatePhone } from '../utils/validation';
import { logoSvg } from '../assets/logo.svg';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);

  const validateForm = () => {
    const newErrors = {};
    
    if (!validateName(name)) {
      newErrors.name = 'Please enter a valid name';
    }
    
    if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (phone && !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await register({
        name,
        email,
        phone,
        password,
        role
      });
      // Navigation will happen automatically via the AppNavigator when auth state changes
    } catch (error) {
      setErrors({
        general: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <SvgXml xml={logoSvg} width={200} height={50} />
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.titleText}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
          
          {errors.general && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}
          
          <FormInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            icon="person-outline"
            error={errors.name}
            autoCapitalize="words"
          />
          
          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            icon="mail-outline"
            keyboardType="email-address"
            error={errors.email}
            autoCapitalize="none"
          />
          
          <FormInput
            label="Phone Number (Optional)"
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            icon="call-outline"
            keyboardType="phone-pad"
            error={errors.phone}
          />
          
          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            icon="lock-closed-outline"
            secureTextEntry
            error={errors.password}
          />
          
          <FormInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            icon="checkmark-circle-outline"
            secureTextEntry
            error={errors.confirmPassword}
          />
          
          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'customer' && styles.roleButtonActive
              ]}
              onPress={() => setRole('customer')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'customer' && styles.roleButtonTextActive
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === 'tailor' && styles.roleButtonActive
              ]}
              onPress={() => setRole('tailor')}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  role === 'tailor' && styles.roleButtonTextActive
                ]}
              >
                Tailor
              </Text>
            </TouchableOpacity>
          </View>
          
          <Button
            title="Sign Up"
            onPress={handleRegister}
            loading={loading}
            style={styles.registerButton}
          />
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  titleText: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: `${theme.colors.error}20`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  roleLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  roleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  roleButtonTextActive: {
    color: theme.colors.white,
  },
  registerButton: {
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.textLight,
  },
  loginLink: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: theme.colors.primary,
  },
});

export default RegisterScreen;