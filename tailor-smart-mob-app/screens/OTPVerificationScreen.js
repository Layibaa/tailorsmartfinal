import React, { useState, useContext, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import AuthHeader from '../components/AuthHeader';
import FormButton from '../components/FormButton';
import LoadingOverlay from '../components/LoadingOverlay';

// Utils
import authService from '../utils/authService';
import { AuthContext } from '../utils/authContext';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { mobileNumber, purpose } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const { login, setAuthError } = useContext(AuthContext);
  
  // Create refs for each input field
  const inputRefs = Array(6).fill(0).map(() => useRef(null));

  // Countdown timer
  useEffect(() => {
    if (timeLeft === 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft]);
  
  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle input change for OTP fields
  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      // If pasting multiple digits, limit to the current field
      value = value.slice(0, 1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-advance to next field if value is entered
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace key for OTP fields
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await authService.forgotPassword(mobileNumber);
      setTimeLeft(300); // Reset timer
      
      // Check if debug OTP is provided by the server (development mode)
      if (response && response.debug && response.debug.otp) {
        Alert.alert('OTP Sent', `A new OTP has been sent to your mobile number.\n\nDEV MODE: The OTP is ${response.debug.otp}`);
      } else {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify OTP
  const handleVerifyOTP = async () => {
    setIsLoading(true);
    try {
      const otpString = otp.join('');
      
      if (otpString.length !== 6) {
        throw new Error('Please enter all 6 digits of the OTP');
      }
      
      const response = await authService.verifyOTP(mobileNumber, otpString);
      
      if (purpose === 'registration') {
        // After successful verification, navigate to login screen
        Alert.alert('Success', 'Registration successful. Please login to continue.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') }
        ]);
      } else if (purpose === 'password_reset') {
        // Navigate to reset password screen
        navigation.navigate('ResetPassword', { mobileNumber });
      } else if (purpose === 'login') {
        // Login the user directly
        await login(response.token, response.user);
      }
    } catch (error) {
      setAuthError(error);
      Alert.alert('Verification Failed', error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AuthHeader title="OTP Verification" showBackButton={true} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {mobileNumber}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={styles.otpInput}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                autoCapitalize="none"
                selectTextOnFocus
              />
            ))}
          </View>

          <Text style={styles.timerText}>
            {timeLeft > 0 ? `Code expires in ${formatTime(timeLeft)}` : 'Code has expired'}
          </Text>

          <FormButton
            buttonTitle="Verify OTP"
            onPress={handleVerifyOTP}
            disabled={otp.some(digit => !digit) || timeLeft === 0}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={timeLeft > 0}
              style={timeLeft > 0 ? styles.resendDisabled : styles.resend}
            >
              <Text style={[styles.resendButtonText, timeLeft > 0 && styles.resendDisabledText]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      <LoadingOverlay visible={isLoading} message="Verifying OTP..." />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: '#f9f9f9',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#666',
    marginRight: 5,
  },
  resend: {
    padding: 5,
  },
  resendDisabled: {
    padding: 5,
  },
  resendButtonText: {
    color: '#0066CC',
    fontWeight: '600',
  },
  resendDisabledText: {
    color: '#999',
  },
});

export default OTPVerificationScreen;
