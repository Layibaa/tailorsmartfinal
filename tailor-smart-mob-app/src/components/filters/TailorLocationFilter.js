import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../../styles/colors';

const CITIES = ['Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta'];
const ISLAMABAD_REGIONS = [
  'Blue Area', 'F-6', 'F-7', 'F-8', 'F-10', 
  'G-6', 'G-7', 'G-8', 'G-10', 'H-8', 'I-8', 
  'Bahria Town', 'DHA', 'Rawat', 'Tarlai',
  'E-7', 'E-11', 'G-9', 'G-11', 'I-9', 'I-10'
];

const TailorLocationFilter = ({ 
  selectedCity, 
  selectedRegion, 
  onCityChange, 
  onRegionChange 
}) => {
  const handleCityChange = (city) => {
    onCityChange(city);
    // Clear region when city changes
    if (city !== 'Islamabad') {
      onRegionChange('');
    }
  };

  return (
    <View style={styles.container}>
      {/* City Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.label}>Filter by City</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCity}
            onValueChange={handleCityChange}
            style={styles.picker}
          >
            <Picker.Item label="All Cities" value="" />
            {CITIES.map(city => (
              <Picker.Item 
                key={city} 
                label={city} 
                value={city} 
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Region Filter - Only show if Islamabad is selected */}
      {selectedCity === 'Islamabad' && (
        <View style={styles.filterSection}>
          <Text style={styles.label}>Filter by Region</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRegion}
              onValueChange={onRegionChange}
              style={styles.picker}
            >
              <Picker.Item label="All Regions" value="" />
              {ISLAMABAD_REGIONS.map(region => (
                <Picker.Item 
                  key={region} 
                  label={region} 
                  value={region} 
                />
              ))}
            </Picker>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  filterSection: {
    marginBottom: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 8
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    backgroundColor: colors.white
  },
  picker: {
    height: 45,
    color: colors.black
  }
});

export default TailorLocationFilter;