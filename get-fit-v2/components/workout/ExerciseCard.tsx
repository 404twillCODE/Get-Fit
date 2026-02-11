/**
 * Exercise card component with neon accents and animations
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import type { ExerciseWithSets } from '../../lib/types';
import { SetRow } from './SetRow';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ExerciseCardProps {
  exercise: ExerciseWithSets;
  onSetComplete: (exerciseId: string, setNumber: number) => void;
  completedSets: Set<number>;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSetComplete,
  completedSets,
}) => {
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(0);

  React.useEffect(() => {
    // Animate entrance
    scale.value = withSpring(1, springConfig.gentle);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: borderColor.value === 1 ? colors.neonPrimary : colors.border,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig.snappy);
    borderColor.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
    borderColor.value = withTiming(0, { duration: 200 });
  };

  const allSetsCompleted = exercise.sets?.every((set) =>
    completedSets.has(set.set_number)
  );

  return (
    <AnimatedTouchable
      style={[styles.card, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{exercise.name}</Text>
          <View style={styles.categoriesContainer}>
            {exercise.categories.map((cat, index) => (
              <View key={index} style={styles.categoryTag}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>
        {allSetsCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedText}>✓</Text>
          </View>
        )}
      </View>

      {exercise.notes && (
        <Text style={styles.notes}>{exercise.notes}</Text>
      )}

      <View style={styles.setsContainer}>
        <Text style={styles.setsLabel}>Sets</Text>
        {exercise.sets?.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            isCompleted={completedSets.has(set.set_number)}
            onToggle={() => onSetComplete(exercise.id, set.set_number)}
          />
        ))}
      </View>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryTag: {
    backgroundColor: colors.neonPrimary + '20',
    borderWidth: 1,
    borderColor: colors.neonPrimary,
    borderRadius: layout.borderRadius.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: typography.sizes.tiny,
    color: colors.neonPrimary,
    fontWeight: typography.weights.medium,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: colors.background,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
  },
  notes: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  setsContainer: {
    marginTop: spacing.sm,
  },
  setsLabel: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: typography.weights.medium,
  },
});

