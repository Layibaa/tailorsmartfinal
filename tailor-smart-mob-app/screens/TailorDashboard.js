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

const TailorDashboard = () => {
  const { authState, logout } = useContext(AuthContext);
  const { userData } = authState;

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tailor Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="scissors" size={40} color="#0066CC" />
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, Tailor!</Text>
          <Text style={styles.shopName}>{userData?.shopName || 'Your Shop'}</Text>
          <Text style={styles.mobileText}>Mobile: {userData?.mobileNumber}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Shop Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shop Name:</Text>
            <Text style={styles.infoValue}>{userData?.shopName || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{userData?.location || 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price Range:</Text>
            <Text style={styles.infoValue}>
              {userData?.priceRange 
                ? `${userData.priceRange.min} - ${userData.priceRange.max}`
                : 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Performance Metrics</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Orders</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>0</Text>
              <Text style={styles.metricLabel}>Ratings</Text>
            </View>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Available Features</Text>
          <Text style={styles.featureDescription}>
            As a tailor, you can:
          </Text>
          <View style={styles.featureItem}>
            <Feather name="users" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Manage your customer requests</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="calendar" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Schedule appointments</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="dollar-sign" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Manage your price listings</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="activity" size={20} color="#0066CC" style={styles.featureIcon} />
            <Text style={styles.featureText}>Track your business analytics</Text>
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
  shopName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066CC',
    marginBottom: 4,
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
  metricsCard: {
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
  metricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
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

export default TailorDashboard;
