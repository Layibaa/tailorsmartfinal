import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const ProfileScreen = ({ navigation }) => {
  // In a real app, this would come from your authentication state
  const user = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    role: 'Customer',
    avatar: 'https://tryeasel.dev/placeholder.svg?width=100&height=100',
  };

  const handleLogout = () => {
    // In a real app, you would handle logout here
    navigation.navigate('Welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      
      <View style={styles.profileCard}>
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          alt="User Avatar"
        />
        <Text style={styles.name}>{user.name}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{user.role}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <MaterialIcons name="email" size={20} color="#AEDFF7" />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <MaterialIcons name="phone" size={20} color="#AEDFF7" />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <CustomButton
          title="Edit Profile"
          variant="secondary"
          color="#AEDFF7"
          onPress={() => navigation.navigate('EditProfile')}
        />
        
        <CustomButton
          title="Logout"
          variant="outline"
          color="black"
          onPress={handleLogout}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_600SemiBold',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },
  roleTag: {
    backgroundColor: '#AEDFF7',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  roleText: {
    color: 'white',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  infoContainer: {
    width: '100%',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  actionsContainer: {
    width: '100%',
  },
});

export default ProfileScreen;