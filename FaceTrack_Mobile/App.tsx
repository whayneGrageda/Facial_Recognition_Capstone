import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { COLORS } from './src/theme/colors';

// ─── Root Stack ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Navigation Root ──────────────────────────────────────────────────────────
// Reads auth state and routes to Login or the main tab navigator.

const NavigationRoot = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a gold spinner while AsyncStorage is being read on startup
  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.gold} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <NavigationRoot />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
