/**
 * Protected route wrapper - redirects to auth if not authenticated
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './AuthProvider';
import { AuthScreen } from './AuthScreen';
import { colors } from '../../theme/colors';

interface AuthGateProps {
  children: React.ReactNode;
  onAuthSuccess?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  onAuthSuccess,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonPrimary} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen onAuthSuccess={onAuthSuccess} />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

