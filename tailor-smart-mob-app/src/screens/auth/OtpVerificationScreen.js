import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { resendOtp } from '../../services/api';
import colors from '../../styles/colors';

const OtpVerificationScreen = ({ route, navigation }) => {
  const { verifyOtp, isLoading } = useContext(AuthContext);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  
  const inputRefs = useRef([]);
  
  // Ensure userId is properly extracted from route params
  const { userId } = route.params || {};
  
  // Validate userId early
  useEffect(() => {
    if (!userId) {
      setError('User ID is missing. Please go back and try again.');
      console.error('Missing userId in OTP verification screen');
    }
  }, [userId]);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    // Only allow digits
    const formattedValue = value.replace(/[^0-9]/g, '');
    newOtp[index] = formattedValue;
    setOtp(newOtp);
    
    // Auto-advance to next input
    if (formattedValue && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handleVerify = async () => {
    setError(null);
    
    // Check if OTP is complete
    const completeOtp = otp.join('');
    if (completeOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    
    // Validate userId before making API call
    if (!userId) {
      setError('User ID is missing. Please go back and try again.');
      console.error('Missing userId in handleVerify');
      return;
    }
    
    console.log('Verifying OTP:', { userId, otp: completeOtp });
    
    try {
      const result = await verifyOtp(userId, completeOtp);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Verification failed. Please try again.');
    }
  };
  
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    // Validate userId before making API call
    if (!userId) {
      setError('User ID is missing. Please go back and try again.');
      console.error('Missing userId in handleResendOtp');
      return;
    }
    
    setIsResending(true);
    try {
      await resendOtp(userId);
      setResendCooldown(60);
      setError(null);
      Alert.alert('Success', 'A new OTP has been sent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Account</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit verification code to your email address.
          Please enter it below to verify your account.
        </Text>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={el => (inputRefs.current[index] = el)}
              style={styles.otpInput}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>
        
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Button title="Verify" onPress={handleVerify} />
        )}
        
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          {isResending ? (
            <LoadingSpinner size="small" />
          ) : (
            <TouchableOpacity 
              onPress={handleResendOtp}
              disabled={resendCooldown > 0}
            >
              <Text style={[
                styles.resendButton,
                resendCooldown > 0 && styles.resendButtonDisabled
              ]}>
                {resendCooldown > 0 
                  ? `Resend (${resendCooldown}s)` 
                  : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    width: 45,
    height: 55,
    marginHorizontal: 5
  },
  errorText: {
    color: colors.error,
    marginBottom: 15,
    textAlign: 'center'
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20
  },
  resendText: {
    color: colors.gray,
    marginRight: 5
  },
  resendButton: {
    color: colors.black,
    fontWeight: '600'
  },
  resendButtonDisabled: {
    color: colors.gray
  }
});

export default OtpVerificationScreen;