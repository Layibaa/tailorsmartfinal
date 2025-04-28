import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const Button = ({ 
  title, 
  onPress, 
  buttonStyle, 
  textStyle, 
  disabled = false, 
  loading = false,
  icon = null,
  iconPosition = 'left',
  small = false,
  outline = false,
  danger = false
}) => {
  // Determine button background color based on props
  const getButtonStyle = () => {
    if (disabled) return styles.disabledButton;
    if (outline) return styles.outlineButton;
    if (danger) return styles.dangerButton;
    return styles.button;
  };
  
  // Determine text color based on props
  const getTextStyle = () => {
    if (disabled) return styles.disabledText;
    if (outline) return styles.outlineText;
    if (danger) return styles.buttonText;
    return styles.buttonText;
  };
  
  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        small ? styles.smallButton : null,
        buttonStyle
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={outline ? colors.black : colors.white} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Feather 
              name={icon} 
              size={small ? 16 : 20} 
              color={outline ? colors.black : colors.white} 
              style={styles.leftIcon} 
            />
          )}
          <Text style={[getTextStyle(), small ? styles.smallText : null, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Feather 
              name={icon} 
              size={small ? 16 : 20} 
              color={outline ? colors.black : colors.white} 
              style={styles.rightIcon} 
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.black,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.black
  },
  dangerButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  disabledButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 16
  },
  outlineText: {
    color: colors.black,
    fontWeight: '600',
    fontSize: 16
  },
  disabledText: {
    color: colors.gray,
    fontWeight: '600',
    fontSize: 16
  },
  smallText: {
    fontSize: 14
  },
  leftIcon: {
    marginRight: 8
  },
  rightIcon: {
    marginLeft: 8
  }
});

export default Button;
