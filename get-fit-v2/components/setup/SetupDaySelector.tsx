/**
 * Step 1: Select workout days
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface SetupDaySelectorProps {
  selectedDays: number[];
  onToggleDay: (dayIndex: number) => void;
  onNext: () => void;
}

export const SetupDaySelector: React.FC<SetupDaySelectorProps> = ({
  selectedDays,
  onToggleDay,
  onNext,
}) => {
  const slideAnim = useSharedValue(20);
  const opacityAnim = useSharedValue(0);

  React.useEffect(() => {
    slideAnim.value = withSpring(0, springConfig.gentle);
    opacityAnim.value = withSpring(1, springConfig.gentle);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: opacityAnim.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>💪</Text>
        <Text style={styles.title}>Select Your Workout Days</Text>
        <Text style={styles.subtitle}>
          Which days of the week do you work out?
        </Text>
      </View>

      <View style={styles.daysContainer}>
        {DAYS.map((day, index) => {
          const isSelected = selectedDays.includes(index);
          const scale = useSharedValue(isSelected ? 1.05 : 1);
          const borderColor = useSharedValue(
            isSelected ? colors.neonPrimary : colors.border
          );

          React.useEffect(() => {
            scale.value = withSpring(isSelected ? 1.05 : 1, springConfig.snappy);
            borderColor.value = withSpring(
              isSelected ? 1 : 0,
              springConfig.snappy
            );
          }, [isSelected]);

          const dayAnimatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
            borderColor: isSelected ? colors.neonPrimary : colors.border,
          }));

          return (
            <AnimatedTouchable
              key={day}
              style={[styles.dayButton, dayAnimatedStyle, isSelected && styles.dayButtonSelected]}
              onPress={() => onToggleDay(index)}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day}
              </Text>
            </AnimatedTouchable>
          );
        })}
      </View>

      {selectedDays.length === 0 && (
        <Text style={styles.warning}>
          Please select at least one workout day
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          selectedDays.length === 0 && styles.nextButtonDisabled,
        ]}
        onPress={onNext}
        disabled={selectedDays.length === 0}
      >
        <Text
          style={[
            styles.nextButtonText,
            selectedDays.length === 0 && styles.nextButtonTextDisabled,
          ]}
        >
          Next
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  dayButton: {
    width: '45%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: layout.borderRadius.large,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.neonPrimary + '20',
  },
  dayText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  dayTextSelected: {
    color: colors.neonPrimary,
    fontWeight: typography.weights.bold,
  },
  warning: {
    fontSize: typography.sizes.small,
    color: colors.neonOrange,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  nextButton: {
    backgroundColor: colors.neonPrimary,
    paddingVertical: spacing.lg,
    borderRadius: layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  nextButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.background,
  },
  nextButtonTextDisabled: {
    color: colors.textTertiary,
  },
});

