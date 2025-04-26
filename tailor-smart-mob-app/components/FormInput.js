import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet 
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

const FormInput = ({ 
  placeholder, 
  error, 
  secureTextEntry = false, 
  ...props 
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          error && styles.errorInput
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        secureTextEntry={secureTextEntry}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SIZES.padding,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    ...FONTS.body3,
    color: COLORS.black,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorInput: {
    borderColor: COLORS.error,
  },
  errorText: {
    ...FONTS.body4,
    color: COLORS.error,
    marginTop: SIZES.base,
  },
});

export default FormInput;
