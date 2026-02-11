/**
 * Main app entry point
 * Handles routing: Auth → Setup → Main App
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthGate } from './components/auth/AuthGate';
import { SetupFlow } from './components/setup/SetupFlow';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { getProfile } from './lib/database';
import { colors } from './theme/colors';
import { typography } from './theme/typography';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.neonPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: typography.sizes.tiny,
          fontWeight: typography.weights.medium,
        },
      }}
    >
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    const checkSetup = async () => {
      if (!user) {
        setSetupComplete(null);
        setCheckingSetup(false);
        return;
      }

      try {
        const profile = await getProfile(user.id);
        setSetupComplete(profile?.setup_complete || false);
      } catch (error) {
        console.error('Error checking setup status:', error);
        setSetupComplete(false);
      } finally {
        setCheckingSetup(false);
      }
    };

    if (!authLoading) {
      checkSetup();
    }
  }, [user, authLoading]);

  if (authLoading || checkingSetup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonPrimary} />
      </View>
    );
  }

  if (!user) {
    return (
      <AuthGate
        onAuthSuccess={() => {
          // Auth success handled by AuthGate
        }}
      />
    );
  }

  if (!setupComplete) {
    return (
      <SetupFlow
        onComplete={() => {
          setSetupComplete(true);
        }}
      />
    );
  }

  return <MainTabs />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
          <StatusBar style="light" />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
