// tailor-smart-mob-app/src/components/forms/LocationPicker.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../../styles/colors';

const CITIES = ['Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta'];
const ISLAMABAD_REGIONS = [
  'Blue Area', 'F-6', 'F-7', 'F-8', 'F-10', 
  'G-6', 'G-7', 'G-8', 'G-10', 'H-8', 'I-8', 
  'Bahria Town', 'DHA', 'Rawat', 'Tarlai',
  'E-7', 'E-11', 'G-9', 'G-11', 'I-9', 'I-10'
];

const LocationPicker = ({ 
  city, 
  region, 
  onCityChange, 
  onRegionChange, 
  errors = {},
  touched = {} 
}) => {
  const handleCityChange = (selectedCity) => {
    onCityChange(selectedCity);
    
    // Clear region if changing away from Islamabad
    if (selectedCity !== 'Islamabad') {
      onRegionChange('');
    }
  };

  return (
    <View style={styles.container}>
      {/* City Picker */}
      <Text style={styles.label}>City *</Text>
      <View style={[
        styles.pickerContainer, 
        touched.city && errors.city && styles.pickerError
      ]}>
        <Picker
          selectedValue={city}
          onValueChange={handleCityChange}
          style={styles.picker}
        >
          <Picker.Item label="Select your city" value="" />
          {CITIES.map(cityOption => (
            <Picker.Item 
              key={cityOption} 
              label={cityOption} 
              value={cityOption} 
            />
          ))}
        </Picker>
      </View>
      {touched.city && errors.city && (
        <Text style={styles.errorText}>{errors.city}</Text>
      )}

      {/* Region Picker - Only show if Islamabad is selected */}
      {city === 'Islamabad' && (
        <>
          <Text style={styles.label}>Region/Sector *</Text>
          <View style={[
            styles.pickerContainer, 
            touched.region && errors.region && styles.pickerError
          ]}>
            <Picker
              selectedValue={region}
              onValueChange={onRegionChange}
              style={styles.picker}
            >
              <Picker.Item label="Select your area" value="" />
              {ISLAMABAD_REGIONS.map(regionOption => (
                <Picker.Item 
                  key={regionOption} 
                  label={regionOption} 
                  value={regionOption} 
                />
              ))}
            </Picker>
          </View>
          {touched.region && errors.region && (
            <Text style={styles.errorText}>{errors.region}</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 8
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: colors.white
  },
  pickerError: {
    borderColor: colors.error
  },
  picker: {
    height: 50,
    color: colors.black
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: -5,
    marginBottom: 10
  }
});

export default LocationPicker;