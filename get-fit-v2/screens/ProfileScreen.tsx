/**
 * Profile screen (placeholder)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { typography } from '../theme/typography';
import { useAuth } from '../components/auth/AuthProvider';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  userInfo: {
    marginBottom: spacing.xl,
  },
  email: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: typography.sizes.body,
    color: colors.neonSecondary,
    fontWeight: typography.weights.semibold,
  },
});

