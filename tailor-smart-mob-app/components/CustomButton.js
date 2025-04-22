import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const CustomButton = ({ 
  title, 
  onPress, 
  variant = 'primary', // primary, secondary, outline, text
  color = '#AEDFF7', // pastel blue default
  disabled = false 
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: color,
          borderColor: color,
        };
      case 'secondary':
        return {
          backgroundColor: 'white',
          borderColor: color,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: color,
        };
      case 'text':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      default:
        return {
          backgroundColor: color,
          borderColor: color,
        };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: 'white' };
      case 'secondary':
      case 'outline':
        return { color: 'black' };
      case 'text':
        return { color: color };
      default:
        return { color: 'white' };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, getTextStyle(), disabled && styles.disabledText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default CustomButton;