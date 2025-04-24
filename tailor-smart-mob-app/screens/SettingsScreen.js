import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import ProfileItem from '../components/ProfileItem';
import Button from '../components/Button';
import { theme } from '../utils/theme';
import { AuthContext } from '../services/auth';
import { updateUserSettings, deleteAccount } from '../services/api';

const SettingsScreen = ({ navigation }) => {
  const { authState, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  
  // Settings state
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  
  const handleNotificationToggle = async (type, value) => {
    try {
      let settings = {};
      
      switch (type) {
        case 'push':
          setPushNotifications(value);
          settings = { pushNotifications: value };
          break;
        case 'email':
          setEmailNotifications(value);
          settings = { emailNotifications: value };
          break;
        case 'orders':
          setOrderUpdates(value);
          settings = { orderUpdates: value };
          break;
        case 'chat':
          setChatNotifications(value);
          settings = { chatNotifications: value };
          break;
      }
      
      await updateUserSettings(settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
      
      // Revert toggle if error
      switch (type) {
        case 'push':
          setPushNotifications(!value);
          break;
        case 'email':
          setEmailNotifications(!value);
          break;
        case 'orders':
          setOrderUpdates(!value);
          break;
        case 'chat':
          setChatNotifications(!value);
          break;
      }
    }
  };

  const handlePasswordChange = () => {
    // Navigate to change password screen (not implemented in this version)
    Alert.alert('Feature Coming Soon', 'Password change will be available in the next version.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteAccount();
              logout();
              // The navigation will happen automatically via AppNavigator
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications on your device
              </Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={(value) => handleNotificationToggle('push', value)}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              thumbColor={pushNotifications ? theme.colors.primary : theme.colors.lightGray}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive updates via email
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={(value) => handleNotificationToggle('email', value)}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              thumbColor={emailNotifications ? theme.colors.primary : theme.colors.lightGray}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Order Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about order status changes
              </Text>
            </View>
            <Switch
              value={orderUpdates}
              onValueChange={(value) => handleNotificationToggle('orders', value)}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              thumbColor={orderUpdates ? theme.colors.primary : theme.colors.lightGray}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
              <Text style={styles.settingText}>Chat Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about new messages
              </Text>
            </View>
            <Switch
              value={chatNotifications}
              onValueChange={(value) => handleNotificationToggle('chat', value)}
              trackColor={{ false: theme.colors.border, true: `${theme.colors.primary}80` }}
              thumbColor={chatNotifications ? theme.colors.primary : theme.colors.lightGray}
            />
          </View>
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ProfileItem 
            icon="person-outline"
            title="Edit Profile"
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <ProfileItem 
            icon="lock-closed-outline"
            title="Change Password"
            onPress={handlePasswordChange}
          />
        </Card>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <ProfileItem 
            icon="information-circle-outline"
            title="App Version"
            value="1.0.0"
            showChevron={false}
          />
          
          <ProfileItem 
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => {}}
          />
          
          <ProfileItem 
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => {}}
          />
        </Card>
        
        <Button
          title="Delete Account"
          variant="outline"
          onPress={handleDeleteAccount}
          loading={loading}
          style={styles.deleteButton}
          textStyle={styles.deleteButtonText}
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingLabel: {
    flex: 1,
    marginRight: 16,
  },
  settingText: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  deleteButton: {
    marginTop: 8,
    borderColor: theme.colors.error,
  },
  deleteButtonText: {
    color: theme.colors.error,
  },
});
