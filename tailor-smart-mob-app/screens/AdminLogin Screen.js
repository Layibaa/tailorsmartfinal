import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import Logo from '../components/Logo';
import Loading from '../components/Loading';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

// Validation schema
const adminLoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required'),
  password: Yup.string()
    .required('Password is required')
});

const AdminLoginScreen = ({ navigation }) => {
  const { loginAdmin, error, setError, isLoading } = useContext(AuthContext);

  const handleLogin = async (values) => {
    const result = await loginAdmin(values.username, values.password);
    if (result.success) {
      console.log('Admin login successful');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Logo />
            
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e' }}
              style={styles.backgroundImage}
            />
            
            <Text style={styles.title}>Admin Login</Text>
            <Text style={styles.subtitle}>Sign in to your admin dashboard</Text>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
            
            <Formik
              initialValues={{ username: '', password: '' }}
              validationSchema={adminLoginSchema}
              onSubmit={handleLogin}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <>
                  <FormInput
                    placeholder="Username"
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    value={values.username}
                    error={touched.username && errors.username}
                    autoCapitalize="none"
                  />
                  
                  <FormInput
                    placeholder="Password"
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    value={values.password}
                    secureTextEntry
                    error={touched.password && errors.password}
                  />
                  
                  <FormButton title="Login" onPress={handleSubmit} />
                </>
              )}
            </Formik>
            
            <View style={styles.footer}>
              <Text
                style={styles.backLink}
                onPress={() => {
                  setError(null);
                  navigation.navigate('Login');
                }}
              >
                Back to Customer/Tailor Login
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  backgroundImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 20,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.error,
    marginBottom: SIZES.padding,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: SIZES.padding * 2,
  },
  backLink: {
    ...FONTS.body4,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
});

export default AdminLoginScreen;