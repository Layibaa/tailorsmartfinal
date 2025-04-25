import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './utils/authContext';
import AppNavigator from './AppNavigator';
import { LogBox } from 'react-native';

// Ignore specific warnings that might come from 3rd party libraries
LogBox.ignoreLogs(['Warning: ...']); // Specific warnings can be added here

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
