import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Text 
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../styles/globalStyles';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  text: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginTop: SIZES.padding,
  },
});

export default Loading;
