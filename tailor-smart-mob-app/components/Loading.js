import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { theme } from '../utils/theme';

const Loading = ({ text, fullScreen = true, size = 'large', color = theme.colors.primary }) => {
  if (fullScreen) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.text}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
});

export default Loading;