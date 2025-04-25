import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Context
import { AuthContext } from '../utils/authContext';

const CustomerDashboard = () => {
  const { authState, logout } = useContext(AuthContext);
  const { userData } = authState;

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="user" size={40} color="#0066CC" />
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, Customer!</Text>
          <Text style={styles.mobileText}>Mobile: {userData?.mobileNumber}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>{userData?.gender || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{userData?.age || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height:</Text>
            <Text style={styles.infoValue}>{userData?.height ? `${userData.height} cm` : 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>{userData?.weight ? `${userData.weight} kg` : 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Available Features</Text>
          <Text style={styles.featureDescription}>
            As a customer, you can:
          </Text>
          <View style={styles.featureItem}>
            <Feather name="search" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Find tailors near you</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="calendar" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Book appointments</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="star" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Rate and review tailors</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="clock" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Track your orders</Text>
          </View>
        </View>

        <Text style={styles.noteText}>
          This is a placeholder dashboard. More features will be available soon!
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
  scrollContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  mobileText: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    color: '#666',
    fontSize: 15,
  },
  infoValue: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
  },
  noteText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default CustomerDashboard;
