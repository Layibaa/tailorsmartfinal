// hooks/useAutofillMeasurements.js - Updated version
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import measurementPredictor from '../utils/measurementPredictor';
import { getUserProfile } from '../services/api';

export const useAutofillMeasurements = () => {
  const [isAutofillEnabled, setIsAutofillEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  // Load autofill preference and user profile on mount
  useEffect(() => {
    loadAutofillPreference();
    loadCustomerProfile();
  }, []);

  const loadAutofillPreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('autofillEnabled');
      setIsAutofillEnabled(saved === 'true');
    } catch (error) {
      console.error('Error loading autofill preference:', error);
    }
  };

  const loadCustomerProfile = async () => {
    try {
      console.log('Loading customer profile...');
      const profile = await getUserProfile();
      console.log('Profile response:', profile);
      
      if (profile?.user) {
        const user = profile.user;
        let profileData = null;
        
        // Check if customerProfile exists, otherwise check for direct fields
        if (user.customerProfile) {
          profileData = user.customerProfile;
        } else {
          // Fallback: check if profile data exists directly on user object
          // This might be the case if your signup saves data differently
          profileData = {
            age: user.age,
            gender: user.gender,
            weight: user.weight,
            height: user.height
          };
        }
        
        console.log('Extracted profile data:', profileData);
        setCustomerProfile(profileData);
        
        // Check if profile is complete for autofill
        const isComplete = profileData && 
          profileData.age && 
          profileData.gender && 
          profileData.weight && 
          profileData.height;
        
        console.log('Profile completeness:', isComplete);
        setIsProfileComplete(isComplete);
      }
    } catch (error) {
      console.error('Error loading customer profile:', error);
      setCustomerProfile(null);
      setIsProfileComplete(false);
    }
  };

  const toggleAutofill = async (enabled) => {
    try {
      setIsAutofillEnabled(enabled);
      await AsyncStorage.setItem('autofillEnabled', enabled.toString());
    } catch (error) {
      console.error('Error saving autofill preference:', error);
    }
  };

  const generatePredictedMeasurements = async (userProfile = null) => {
    if (!isAutofillEnabled) return null;
    
    setIsLoading(true);
    try {
      // Use provided profile or the loaded one
      const profile = userProfile || customerProfile;
      
      console.log('Generating predictions with profile:', profile);
      
      if (!profile || !profile.age || !profile.weight || !profile.height || !profile.gender) {
        throw new Error('Incomplete profile data for prediction');
      }

      const predictions = await measurementPredictor.predictMeasurements(profile);
      console.log('Generated predictions:', predictions);
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh profile data
  const refreshProfile = async () => {
    await loadCustomerProfile();
  };

  return {
    isAutofillEnabled,
    isLoading,
    customerProfile,
    isProfileComplete,
    toggleAutofill,
    generatePredictedMeasurements,
    refreshProfile
  };
};