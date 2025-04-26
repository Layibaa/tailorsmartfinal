import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

const AdminDashboardScreen = () => {
  const { userData, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
  };

  // Mock data for demonstration purposes
  const stats = {
    totalCustomers: 248,
    totalTailors: 53,
    activeUsers: 189,
    pendingVerifications: 12,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome, Administrator
        </Text>
        
        <Text style={styles.subtitleText}>
          Manage your application from here
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalCustomers}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalTailors}</Text>
            <Text style={styles.statLabel}>Total Tailors</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pendingVerifications}</Text>
            <Text style={styles.statLabel}>Pending Verifications</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Manage Tailors</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Reports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>System Settings</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: SIZES.padding * 2,
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding * 2,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.lightBlue,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    alignItems: 'center',
  },
  statNumber: {
    ...FONTS.h1,
    color: COLORS.primary,
  },
  statLabel: {
    ...FONTS.body4,
    color: COLORS.black,
  },
  actionButtons: {
    marginVertical: SIZES.padding * 2,
  },
  actionButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    alignItems: 'center',
  },
  actionButtonText: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  logoutButtonText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
});

export default AdminDashboardScreen;
