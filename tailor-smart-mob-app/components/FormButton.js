import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const FormButton = ({
  buttonTitle,
  onPress,
  isLoading = false,
  disabled = false,
  secondary = false,
  style,
  textStyle,
  ...rest
}) => {
  const buttonStyles = [
    styles.buttonContainer,
    secondary ? styles.secondaryButton : styles.primaryButton,
    disabled || isLoading ? styles.disabledButton : {},
    style,
  ];

  const textStyles = [
    styles.buttonText,
    secondary ? styles.secondaryButtonText : styles.primaryButtonText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={secondary ? '#0066CC' : '#ffffff'} />
      ) : (
        <Text style={textStyles}>{buttonTitle}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: '#0066CC',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0066CC',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    borderColor: '#cccccc',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButtonText: {
    color: '#0066CC',
  },
});

export default FormButton;
