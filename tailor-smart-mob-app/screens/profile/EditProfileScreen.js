import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Header from '../../components/Header';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { updateProfile } from '../../utils/api';
import colors from '../../utils/colors';

const EditProfileScreen = ({ navigation }) => {
  const { user, updateUserData } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const { loading, request } = useApi(updateProfile);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Valid email is required');
      return;
    }

    const updatedProfile = {
      name,
      email,
      phone,
      address,
    };

    const result = await request(updatedProfile);
    
    if (result.success) {
      updateUserData(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Edit Profile" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter your full name"
          autoCapitalize="words"
          icon={<Feather name="user" size={20} color={colors.gray} />}
        />
        
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Feather name="mail" size={20} color={colors.gray} />}
        />
        
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          icon={<Feather name="phone" size={20} color={colors.gray} />}
        />
        
        <Input
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter your address"
          multiline={true}
          numberOfLines={3}
          icon={<Feather name="map-pin" size={20} color={colors.gray} />}
        />
        
        <View style={styles.actions}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  actions: {
    marginTop: 24,
    marginBottom: 40,
  },
  saveButton: {
    marginBottom: 12,
  },
});

export default EditProfileScreen;
