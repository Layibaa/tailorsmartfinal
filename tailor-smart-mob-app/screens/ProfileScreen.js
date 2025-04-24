import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import ProfileItem from '../components/ProfileItem';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { AuthContext } from '../services/auth';
import { fetchUserProfile, fetchTailorProfile } from '../services/api';

const ProfileScreen = ({ navigation }) => {
  const { authState, logout } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [tailorProfile, setTailorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isTailor = authState.user?.role === 'tailor';

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const userData = await fetchUserProfile();
      setProfileData(userData);
      
      // If user is a tailor, fetch tailor profile
      if (isTailor) {
        const tailorData = await fetchTailorProfile();
        setTailorProfile(tailorData);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [isTailor]);

  const handleLogout = () => {
    logout();
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Profile"
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
        rightIcon="settings-outline"
        onRightPress={() => navigation.navigate('Settings')}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {profileData?.name ? profileData.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profileData?.name || 'User'}</Text>
          <Text style={styles.profileRole}>{authState.user?.role || 'User'}</Text>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
            <Ionicons name="pencil-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <ProfileItem 
            icon="mail-outline"
            title="Email"
            value={profileData?.email}
            showChevron={false}
          />
          
          <ProfileItem 
            icon="call-outline"
            title="Phone"
            value={profileData?.phone || 'Not set'}
            showChevron={false}
          />
        </Card>
        
        {isTailor && tailorProfile && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Shop Information</Text>
            
            <ProfileItem 
              icon="business-outline"
              title="Shop Name"
              value={tailorProfile.shopName}
              showChevron={false}
            />
            
            <ProfileItem 
              icon="location-outline"
              title="Location"
              value={tailorProfile.location}
              showChevron={false}
            />
            
            <ProfileItem 
              icon="pricetag-outline"
              title="Price Range"
              value={tailorProfile.priceRange}
              showChevron={false}
            />
          </Card>
        )}
        
        {!isTailor && profileData && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Measurement Information</Text>
            
            <ProfileItem 
              icon="transgender-outline"
              title="Gender"
              value={profileData.gender || 'Not set'}
              showChevron={false}
            />
            
            <ProfileItem 
              icon="calendar-outline"
              title="Age"
              value={profileData.age ? `${profileData.age} years` : 'Not set'}
              showChevron={false}
            />
            
            <ProfileItem 
              icon="resize-outline"
              title="Height"
              value={profileData.height ? `${profileData.height} cm` : 'Not set'}
              showChevron={false}
            />
            
            <ProfileItem 
              icon="scale-outline"
              title="Weight"
              value={profileData.weight ? `${profileData.weight} kg` : 'Not set'}
              showChevron={false}
            />
          </Card>
        )}
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          
          <ProfileItem 
            icon="settings-outline"
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
          
          <ProfileItem 
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => {}}
          />
          
          <ProfileItem 
            icon="information-circle-outline"
            title="About App"
            onPress={() => {}}
          />
        </Card>
        
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    color: theme.colors.white,
    fontFamily: 'Poppins-Bold',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
    marginRight: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  logoutButton: {
    marginVertical: 16,
  },
});

export default ProfileScreen;