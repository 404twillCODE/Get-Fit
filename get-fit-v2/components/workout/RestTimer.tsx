/**
 * Full-screen rest timer with neon display and animations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

interface RestTimerProps {
  breakTime: number; // in seconds
  onComplete: () => void;
  onDismiss: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  breakTime,
  onComplete,
  onDismiss,
}) => {
  const [timeLeft, setTimeLeft] = useState(breakTime);
  const [isPaused, setIsPaused] = useState(false);

  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, springConfig.gentle);
    opacity.value = withTiming(1, { duration: 300 });

    // Pulse animation
    pulseScale.value = withRepeat(
      withSpring(1.1, { damping: 15, stiffness: 100 }),
      -1,
      true
    );

  }, []);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, timeLeft, onComplete]);

  useEffect(() => {
    // Update progress
    progress.value = withTiming((breakTime - timeLeft) / breakTime, {
      duration: 1000,
    });
  }, [timeLeft, breakTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => {
    const angle = -90 + progress.value * 360; // Start from top
    return {
      transform: [{ rotate: `${angle}deg` }],
    };
  });


  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.95)', 'rgba(10, 10, 10, 0.95)']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.container, animatedStyle]}>
          <Text style={styles.label}>Rest Time</Text>

          <View style={styles.timerContainer}>
            {/* Progress Ring */}
            <View style={styles.progressRingContainer}>
              <View style={styles.progressRingBackground} />
              <Animated.View
                style={[
                  styles.progressRingFill,
                  {
                    width: CIRCLE_SIZE,
                    height: CIRCLE_SIZE,
                    borderRadius: CIRCLE_SIZE / 2,
                  },
                  progressStyle,
                ]}
              />
            </View>

            {/* Timer Display */}
            <Animated.View style={[styles.timerDisplay, pulseStyle]}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </Animated.View>
          </View>

          <Text style={styles.instruction}>
            {isPaused ? 'Paused' : 'Rest and get ready for your next set'}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setIsPaused(!isPaused)}
            >
              <Text style={styles.controlButtonText}>
                {isPaused ? '▶' : '⏸'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.dismissButton]}
              onPress={onDismiss}
            >
              <Text style={styles.controlButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  label: {
    fontSize: typography.sizes.body,
    color: colors.neonPrimary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.xl,
    fontWeight: typography.weights.semibold,
  },
  timerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  progressRingContainer: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  progressRingBackground: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.border,
  },
  progressRingFill: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.neonPrimary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    ...Platform.select({
      web: {
        boxShadow: `0 0 20px ${colors.neonPrimary}CC`,
      },
      default: {
        shadowColor: colors.neonPrimary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },
  timerDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: typography.weights.bold,
    color: colors.neonPrimary,
    fontFamily: typography.fontFamily.mono,
    ...Platform.select({
      web: {
        textShadow: `0 0 30px ${colors.neonPrimary}FF`,
      },
      default: {
        textShadowColor: colors.neonPrimary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 30,
      },
    }),
  },
  instruction: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  controlButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 2,
    borderColor: colors.neonPrimary,
    backgroundColor: colors.neonPrimary + '20',
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButton: {
    backgroundColor: colors.surface,
  },
  controlButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.neonPrimary,
  },
});

