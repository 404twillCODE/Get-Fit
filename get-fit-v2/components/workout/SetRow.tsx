/**
 * Set row component with checkbox and completion animation
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import type { ExerciseSet } from '../../lib/types';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SetRowProps {
  set: ExerciseSet;
  isCompleted: boolean;
  onToggle: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({ set, isCompleted, onToggle }) => {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isCompleted) {
      checkScale.value = withSpring(1, springConfig.bouncy);
      glowOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 300 })
      );
    } else {
      checkScale.value = withSpring(0, springConfig.snappy);
      glowOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCompleted]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, springConfig.snappy),
      withSpring(1, springConfig.bouncy)
    );
    onToggle();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const formatWeight = (weight: number) => {
    if (weight === 0) return 'bodyweight';
    return `${weight} lbs`;
  };

  return (
    <AnimatedView style={animatedStyle}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.setInfo}>
          <Text style={styles.setNumber}>Set {set.set_number}</Text>
          <Text style={styles.setDetails}>
            {set.target_reps} reps × {formatWeight(set.target_weight)}
          </Text>
          {set.break_time_seconds && set.break_time_seconds > 0 && (
            <Text style={styles.breakTime}>
              {Math.floor(set.break_time_seconds / 60)}:
              {(set.break_time_seconds % 60).toString().padStart(2, '0')} rest
            </Text>
          )}
        </View>
        <View style={styles.checkboxContainer}>
          <Animated.View
            style={[
              styles.checkbox,
              isCompleted && styles.checkboxCompleted,
              glowStyle,
            ]}
          >
            <Animated.View style={[styles.checkmark, checkboxStyle]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </Animated.View>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setInfo: {
    flex: 1,
  },
  setNumber: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  setDetails: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.mono,
  },
  breakTime: {
    fontSize: typography.sizes.tiny,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  checkboxContainer: {
    marginLeft: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    borderColor: colors.neonPrimary,
    backgroundColor: colors.neonPrimary,
    ...Platform.select({
      web: {
        boxShadow: `0 0 10px ${colors.neonPrimary}CC`,
      },
      default: {
        shadowColor: colors.neonPrimary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  checkmark: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.background,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
});

