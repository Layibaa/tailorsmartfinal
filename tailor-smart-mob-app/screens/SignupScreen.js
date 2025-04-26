import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';
import Logo from '../components/Logo';

const SignupScreen = ({ navigation }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Logo />
      
      <Text style={styles.title}>Create an Account</Text>
      
      <Text style={styles.subtitle}>Choose your account type</Text>

      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b' }}
        style={styles.image}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('CustomerSignup')}
        >
          <Text style={styles.buttonText}>I'm a Customer</Text>
          <Text style={styles.buttonDescription}>Looking for tailoring services</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('TailorSignup')}
        >
          <Text style={styles.buttonText}>I'm a Tailor</Text>
          <Text style={styles.buttonDescription}>Offering tailoring services</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text 
            style={styles.loginText}
            onPress={() => navigation.navigate('Login')}
          >
            Login
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginTop: SIZES.padding,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginVertical: SIZES.padding,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: SIZES.padding * 2,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding * 1.5,
    marginBottom: SIZES.padding,
    alignItems: 'center',
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  buttonDescription: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  footer: {
    marginTop: SIZES.padding * 2,
  },
  footerText: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  loginText: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default SignupScreen;
