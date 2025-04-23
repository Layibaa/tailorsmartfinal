import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { useAuth } from '../../context/AuthContext';
import colors from '../../utils/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const renderRoleBadge = () => {
    const getRoleBadgeColor = () => {
      switch(user.role) {
        case 'admin':
          return '#D4AF37'; // Gold
        case 'tailor':
          return colors.primary; // Pastel blue
        case 'customer':
          return colors.gray;
        default:
          return colors.gray;
      }
    };

    return (
      <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor() }]}>
        <Text style={styles.roleBadgeText}>{user.role}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Profile" 
        showBack={false}
        rightComponent={
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <Feather name="edit" size={20} color={colors.black} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            {renderRoleBadge()}
          </View>
        </View>
        
        <Card>
          <View style={styles.infoItem}>
            <Feather name="user" size={20} color={colors.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.infoItem}>
            <Feather name="mail" size={20} color={colors.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
          </View>
          
          <View style={styles.separator} />
          
          <View style={styles.infoItem}>
            <Feather name="phone" size={20} color={colors.gray} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
            </View>
          </View>
        </Card>
        
        <View style={styles.actions}>
          <Button
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.actionButton}
          />
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.white,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.black,
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.gray,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.white,
    textTransform: 'capitalize',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.gray,
  },
  infoValue: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: colors.black,
  },
  separator: {
    height: 1,
    backgroundColor: colors.lightGray,
  },
  actions: {
    marginTop: 24,
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default ProfileScreen;