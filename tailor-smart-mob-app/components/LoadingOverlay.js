import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

const LoadingOverlay = ({ visible, message = 'Loading...' }) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    width: 200,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: 10,
    color: '#333',
    fontSize: 16,
  },
});

export default LoadingOverlay;
