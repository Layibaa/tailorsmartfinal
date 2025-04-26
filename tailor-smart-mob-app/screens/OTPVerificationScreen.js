import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

const OtpVerificationScreen = ({ route, navigation }) => {
  const { email, userType } = route.params;
  const { verifyUserOtp, isLoading, error, setError } = useContext(AuthContext);
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  
  // Focus the first input on mount
  useEffect(() => {
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  }, []);
  
  // Set up timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);
  
  const handleOtpChange = (value, index) => {
    if (value.length > 1) {
      value = value.charAt(0);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus to next input or submit if all filled
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    } else if (index === 5 && newOtp.every(val => val !== '')) {
      handleVerifyOtp();
    }
  };
  
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  const handleVerifyOtp = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }
    
    const result = await verifyUserOtp(email, otpString);
    if (result.success) {
      console.log('OTP verified successfully');
      // Navigate to Home screen regardless of role
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };
  
  const handleResendOtp = () => {
    // Reset timer
    setTimer(60);
    // TODO: Implement resend OTP API call
    Alert.alert('OTP Resent', 'A new OTP has been sent to your email');
  };
  
  if (isLoading) {
    return <Loading />;
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Logo />
      
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        We've sent a 6-digit OTP to {email}
      </Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={el => (inputRefs.current[index] = el)}
            style={styles.otpInput}
            value={digit}
            onChangeText={value => handleOtpChange(value, index)}
            onKeyPress={e => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>
      
      <FormButton
        title="Verify OTP"
        onPress={handleVerifyOtp}
        disabled={otp.some(digit => digit === '')}
      />
      
      <View style={styles.footer}>
        {timer > 0 ? (
          <Text style={styles.timerText}>
            Resend OTP in {timer} seconds
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.changeEmailButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.changeEmailText}>Change Email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
    textAlign: 'center',
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SIZES.padding * 2,
  },
  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    textAlign: 'center',
    fontSize: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    marginTop: SIZES.padding * 2,
    alignItems: 'center',
  },
  timerText: {
    ...FONTS.body4,
    color: COLORS.gray,
    marginBottom: SIZES.padding,
  },
  resendText: {
    ...FONTS.body4,
    color: COLORS.primary,
    marginBottom: SIZES.padding,
  },
  changeEmailButton: {
    padding: SIZES.padding,
  },
  changeEmailText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default OtpVerificationScreen;