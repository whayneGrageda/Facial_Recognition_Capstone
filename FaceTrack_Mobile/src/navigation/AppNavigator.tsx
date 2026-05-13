import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import AttendanceHistoryScreen from '../screens/AttendanceHistoryScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import { COLORS } from '../theme/colors';

// ─── Tab Param List ───────────────────────────────────────────────────────────

export type TabParamList = {
  Dashboard: undefined;
  History: undefined;
  Notifications: undefined;
  Settings: undefined;
};

// ─── Tab Icons ────────────────────────────────────────────────────────────────

interface TabIconProps {
  focused: boolean;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
}

const TabIcon = ({ focused, label, iconName, iconNameOutline }: TabIconProps) => (
  <View style={styles.tabIconContainer}>
    <Ionicons
      name={focused ? iconName : iconNameOutline}
      size={20}
      color={focused ? COLORS.gold : COLORS.cream}
      style={{ opacity: focused ? 1 : 0.45 }}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<TabParamList>();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Home" iconName="home" iconNameOutline="home-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="History" iconName="time" iconNameOutline="time-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Alerts" iconName="notifications" iconNameOutline="notifications-outline" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} label="Profile" iconName="person" iconNameOutline="person-outline" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Root Stack (Login + App) ─────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.dark,
    borderTopColor: COLORS.brown,
    borderTopWidth: 1,
    height: 75,
    paddingBottom: 25,
    paddingTop: 0,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    color: COLORS.cream,
    opacity: 0.45,
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.gold,
    opacity: 1,
    fontWeight: '700',
  },
});
