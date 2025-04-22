import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from '../components/CustomButton';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://tryeasel.dev/placeholder.svg?width=150&height=150' }}
          style={styles.logo}
          alt="App Logo"
        />
        <Text style={styles.appName}>TAILOR APP</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Login"
          variant="secondary"
          color="#AEDFF7"
          onPress={() => navigation.navigate('Login')}
        />
        <CustomButton
          title="Sign Up"
          variant="secondary"
          color="#AEDFF7"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
      
      <Text style={styles.footerText}>
        Elegant tailoring solutions
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  footerText: {
    fontFamily: 'Poppins_400Regular',
    color: '#999',
    marginBottom: 20,
  },
});

export default WelcomeScreen;