import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

const HomeScreen = () => {
  const { userData, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userData?.role === 'customer' ? 'Customer Home' : 'Tailor Home'}
        </Text>
      </View>
      
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1484327973588-c31f829103fe' }}
          style={styles.image}
        />
        
        <Text style={styles.welcomeText}>
          Welcome, {userData?.name || 'User'}!
        </Text>
        
        <Text style={styles.subtitleText}>
          You are logged in as a {userData?.role || 'user'}.
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue}>{userData?.id || 'N/A'}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{userData?.email || 'N/A'}</Text>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    alignItems: 'center',
  },
  headerTitle: {
    ...FONTS.h2,
    color: COLORS.black,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: SIZES.padding * 2,
  },
  welcomeText: {
    ...FONTS.h1,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  subtitleText: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.padding * 2,
  },
  infoContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  infoLabel: {
    ...FONTS.h3,
    color: COLORS.gray,
    width: '30%',
  },
  infoValue: {
    ...FONTS.body3,
    color: COLORS.black,
    width: '70%',
  },
  logoutButton: {
    marginTop: SIZES.padding * 3,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.padding * 3,
    borderRadius: SIZES.radius,
  },
  logoutButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});

export default HomeScreen;
