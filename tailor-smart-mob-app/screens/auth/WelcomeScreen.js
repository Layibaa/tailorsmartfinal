import React from 'react';
import { View, Text, StyleSheet, Image, SafeAreaView } from 'react-native';
import Button from '../../components/Button';
import colors from '../../utils/colors';

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>TS</Text>
          </View>
          <Text style={styles.appName}>TailorSmart</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title}>Welcome to TailorSmart</Text>
          <Text style={styles.description}>
            The smart solution for tailors and customers to manage measurements and orders
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Button 
          title="Login" 
          onPress={() => navigation.navigate('Login')}
          style={styles.button}
        />
        <Button 
          title="Register" 
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          style={styles.button}
        />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: colors.white,
  },
  appName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.black,
  },
  infoContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
  },
  button: {
    marginBottom: 16,
  },
});

export default WelcomeScreen;