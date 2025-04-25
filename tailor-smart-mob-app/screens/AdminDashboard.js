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

const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.adminCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Feather name="shield" size={40} color="#0066CC" />
            </View>
          </View>
          <Text style={styles.welcomeText}>Welcome, Admin!</Text>
          <Text style={styles.adminText}>System Administrator</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>System Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Customers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Tailors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Admin Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="users" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="list" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>View All Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="settings" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>System Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Feather name="bar-chart-2" size={20} color="#fff" style={styles.actionIcon} />
            <Text style={styles.actionButtonText}>Analytics Dashboard</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivitiesCard}>
          <Text style={styles.activitiesTitle}>Recent Activities</Text>
          <View style={styles.activityItem}>
            <View style={styles.activityIconContainer}>
              <Feather name="user-plus" size={16} color="#0066CC" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>No recent activities</Text>
              <Text style={styles.activityTime}>--</Text>
            </View>
          </View>
        </View>

        <Text style={styles.noteText}>
          This is a placeholder admin dashboard. More features will be available soon!
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
  adminCard: {
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
  adminText: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionCard: {
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
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#0066CC',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  recentActivitiesCard: {
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
  activitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  noteText: {
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default AdminDashboard;
