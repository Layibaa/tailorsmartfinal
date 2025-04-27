import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigation from './src/navigation';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { theme } from './src/assets/theme'; // Import your theme file

// Create a custom theme based on our color palette
const paperTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.colors.primary,
    accent: theme.colors.accent,
    background: theme.colors.background,
    surface: theme.colors.background,
    text: theme.colors.text,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <AppNavigation />
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
