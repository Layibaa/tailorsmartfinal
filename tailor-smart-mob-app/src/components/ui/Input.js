import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const Input = ({
  placeholder,
  value,
  onChangeText,
  onBlur,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  iconName,
  multiline = false,
  numberOfLines,
  style,
  label,
  disabled = false
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View 
        style={[
          styles.inputContainer, 
          isFocused && styles.focusedInput,
          error && styles.errorInput,
          disabled && styles.disabledInput,
          multiline && styles.multilineInput,
          style
        ]}
      >
        {iconName && (
          <Feather 
            name={iconName} 
            size={20} 
            color={error ? colors.error : isFocused ? colors.black : colors.gray} 
            style={styles.icon} 
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineTextInput
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={value}
          onChangeText={onChangeText}
          onBlur={(event) => {
            setIsFocused(false);
            if (onBlur) onBlur(event);
          }}
          onFocus={() => setIsFocused(true)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? (numberOfLines || 4) : 1}
          editable={!disabled}
        />
        
        {secureTextEntry && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconButton}>
            <Feather 
              name={isPasswordVisible ? 'eye-off' : 'eye'} 
              size={20} 
              color={colors.gray} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%'
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  focusedInput: {
    borderColor: colors.black
  },
  errorInput: {
    borderColor: colors.error
  },
  disabledInput: {
    backgroundColor: colors.lightGray,
    borderColor: colors.lightGray
  },
  multilineInput: {
    minHeight: 100,
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12
  },
  input: {
    flex: 1,
    height: 48,
    color: colors.black,
    fontSize: 16
  },
  multilineTextInput: {
    height: 'auto',
    textAlignVertical: 'top'
  },
  icon: {
    marginRight: 10
  },
  iconButton: {
    padding: 8
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4
  }
});

export default Input;
