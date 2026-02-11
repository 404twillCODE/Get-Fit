/**
 * Authentication screen with neon design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from './AuthProvider';
import { isSupabaseConfigured } from '../../lib/supabase';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import { GradientButton } from '../common/GradientButton';
import { NeonText } from '../common/NeonText';

const AnimatedView = Animated.createAnimatedComponent(View);

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const slideAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);

  React.useEffect(() => {
    slideAnim.value = withSpring(0, springConfig.gentle);
    opacityAnim.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: opacityAnim.value,
  }));

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message || 'Authentication failed');
    } else {
      onAuthSuccess?.();
    }
  };

  return (
    <LinearGradient
      colors={['#000000', '#0a0a0a', '#000000']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AnimatedView style={[styles.content, animatedStyle]}>
            <View style={styles.header}>
              <NeonText style={styles.title} intensity="intense">
                GET FIT
              </NeonText>
              <Text style={styles.subtitle}>
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </View>

              <GradientButton
                title={isSignUp ? 'Sign Up' : 'Sign In'}
                onPress={handleSubmit}
                variant="primary"
                size="large"
                loading={loading}
                style={styles.button}
              />

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <Text
                  style={styles.switchLink}
                  onPress={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </View>
            </View>
          </AnimatedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.small,
    color: colors.neonPrimary,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.medium,
    padding: spacing.md,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    minHeight: layout.touchTargetMin,
  },
  button: {
    marginTop: spacing.lg,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  switchText: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: typography.sizes.small,
    color: colors.neonPrimary,
    fontWeight: typography.weights.semibold,
  },
  configMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    maxWidth: 400,
    alignSelf: 'center',
  },
  configText: {
    fontSize: typography.sizes.h2,
    color: colors.neonOrange,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: typography.weights.semibold,
  },
  configSubtext: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.lineHeights.body * 1.5,
  },
});

