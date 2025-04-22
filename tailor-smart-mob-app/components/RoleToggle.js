import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const RoleToggle = ({ selectedRole, onRoleChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select your role:</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.leftButton,
            selectedRole === 'customer' && styles.selectedButton,
          ]}
          onPress={() => onRoleChange('customer')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedRole === 'customer' && styles.selectedText,
            ]}
          >
            Customer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.rightButton,
            selectedRole === 'tailor' && styles.selectedButton,
          ]}
          onPress={() => onRoleChange('tailor')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedRole === 'tailor' && styles.selectedText,
            ]}
          >
            Tailor
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  leftButton: {
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },
  rightButton: {
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
  },
  selectedButton: {
    backgroundColor: '#AEDFF7',
  },
  toggleText: {
    fontFamily: 'Poppins_500Medium',
    color: '#666',
  },
  selectedText: {
    color: 'white',
  },
});

export default RoleToggle;