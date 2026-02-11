/**
 * Step 2: Add exercises for each selected day
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import { ExerciseForm } from './ExerciseForm';
import type { ExerciseCategory, ExerciseWithSets } from '../../lib/types';
import { createExercise, createExerciseSets, assignExerciseToDay } from '../../lib/database';
import { useAuth } from '../auth/AuthProvider';

const AnimatedView = Animated.createAnimatedComponent(View);

interface SetupExerciseAdderProps {
  dayIndex: number;
  dayName: string;
  workoutDayId: string;
  onComplete: () => void;
  onBack: () => void;
}

interface ExerciseFormData {
  name: string;
  categories: ExerciseCategory[];
  sets: number;
  reps: number;
  weight: number;
  breakTime: number;
  notes: string;
}

export const SetupExerciseAdder: React.FC<SetupExerciseAdderProps> = ({
  dayIndex,
  dayName,
  workoutDayId,
  onComplete,
  onBack,
}) => {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseWithSets | null>(null);

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

  const handleAddExercise = async (formData: ExerciseFormData) => {
    if (!user) return;

    try {
      // Create exercise
      const exercise = await createExercise(
        user.id,
        formData.name,
        formData.categories,
        formData.notes || null
      );

      if (!exercise) {
        throw new Error('Failed to create exercise');
      }

      // Create sets
      const sets = Array.from({ length: formData.sets }, (_, i) => ({
        set_number: i + 1,
        target_reps: formData.reps,
        target_weight: formData.weight,
        break_time_seconds: formData.breakTime,
      }));

      const createdSets = await createExerciseSets(exercise.id, sets);

      // Assign exercise to workout day
      await assignExerciseToDay(exercise.id, workoutDayId);

      // Add to local state
      const exerciseWithSets: ExerciseWithSets = {
        ...exercise,
        sets: createdSets,
      };

      if (editingExercise) {
        setExercises((prev) =>
          prev.map((e) => (e.id === editingExercise.id ? exerciseWithSets : e))
        );
        setEditingExercise(null);
      } else {
        setExercises((prev) => [...prev, exerciseWithSets]);
      }

      setShowForm(false);
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const handleEditExercise = (exercise: ExerciseWithSets) => {
    setEditingExercise(exercise);
    setShowForm(true);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  };

  if (showForm) {
    return (
      <ExerciseForm
        initialData={
          editingExercise
            ? {
                name: editingExercise.name,
                categories: editingExercise.categories as ExerciseCategory[],
                sets: editingExercise.sets?.length || 3,
                reps: editingExercise.sets?.[0]?.target_reps || 10,
                weight: editingExercise.sets?.[0]?.target_weight || 0,
                breakTime: editingExercise.sets?.[0]?.break_time_seconds || 60,
                notes: editingExercise.notes || '',
              }
            : undefined
        }
        onSubmit={handleAddExercise}
        onCancel={() => {
          setShowForm(false);
          setEditingExercise(null);
        }}
      />
    );
  }

  return (
    <AnimatedView style={[styles.container, animatedStyle]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🏋️</Text>
        <Text style={styles.title}>Add Exercises for {dayName}</Text>
        <Text style={styles.subtitle}>
          What exercises do you do on {dayName}?
        </Text>
      </View>

      <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No exercises added yet. Tap the button below to add your first exercise!
            </Text>
          </View>
        ) : (
          exercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseCategories}>
                    {exercise.categories.join(', ')} • {exercise.sets?.length || 0} sets
                  </Text>
                </View>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditExercise(exercise)}
                  >
                    <Text style={styles.actionText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteExercise(exercise.id)}
                  >
                    <Text style={styles.actionText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <View style={styles.navigation}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={onComplete}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
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
  exercisesList: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  exerciseCategories: {
    fontSize: typography.sizes.small,
    color: colors.textSecondary,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    padding: spacing.sm,
  },
  actionText: {
    fontSize: 20,
  },
  actions: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.neonPrimary,
    paddingVertical: spacing.lg,
    borderRadius: layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.background,
  },
  navigation: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.neonPrimary,
    paddingVertical: spacing.md,
    borderRadius: layout.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.bold,
    color: colors.background,
  },
});

