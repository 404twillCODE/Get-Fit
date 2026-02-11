/**
 * Main workout tracking screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { spacing, layout } from '../theme/spacing';
import { typography } from '../theme/typography';
import { springConfig } from '../theme/animations';
import { useAuth } from '../components/auth/AuthProvider';
import { ExerciseCard } from '../components/workout/ExerciseCard';
import { RestTimer } from '../components/workout/RestTimer';
import {
  getWorkoutDays,
  getExercisesForDay,
  createWorkoutSession,
  createSetCompletion,
} from '../lib/database';
import type { WorkoutDay, ExerciseWithSets } from '../lib/types';

const AnimatedView = Animated.createAnimatedComponent(View);

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WorkoutScreen: React.FC = () => {
  const { user } = useAuth();
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay());
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithSets[]>([]);
  const [completedSets, setCompletedSets] = useState<Map<string, Set<number>>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [activeTimer, setActiveTimer] = useState<{
    exerciseId: string;
    setNumber: number;
    breakTime: number;
  } | null>(null);
  const [workoutSessionId, setWorkoutSessionId] = useState<string | null>(null);

  const slideAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    slideAnim.value = withSpring(0, springConfig.gentle);
    opacityAnim.value = withSpring(1, springConfig.gentle);
    loadWorkoutData();
  }, []);

  useEffect(() => {
    loadExercisesForDay();
  }, [currentDayIndex, workoutDays]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
    opacity: opacityAnim.value,
  }));

  const loadWorkoutData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const days = await getWorkoutDays(user.id);
      setWorkoutDays(days);

      // Create workout session if it doesn't exist
      const currentDay = days.find((d) => d.day_of_week === currentDayIndex);
      if (currentDay) {
        const session = await createWorkoutSession(user.id, currentDay.id);
        if (session) {
          setWorkoutSessionId(session.id);
        }
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesForDay = async () => {
    if (!user) return;

    try {
      const currentDay = workoutDays.find((d) => d.day_of_week === currentDayIndex);
      if (!currentDay) {
        setExercises([]);
        return;
      }

      const dayExercises = await getExercisesForDay(currentDay.id);
      setExercises(dayExercises);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleSetComplete = async (exerciseId: string, setNumber: number) => {
    if (!workoutSessionId) return;

    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const set = exercise.sets?.find((s) => s.set_number === setNumber);
    if (!set) return;

    const isCompleted = completedSets.get(exerciseId)?.has(setNumber) || false;

    // Update local state immediately (optimistic update)
    setCompletedSets((prev) => {
      const newMap = new Map(prev);
      const exerciseSets = newMap.get(exerciseId) || new Set<number>();
      if (isCompleted) {
        exerciseSets.delete(setNumber);
      } else {
        exerciseSets.add(setNumber);
      }
      newMap.set(exerciseId, exerciseSets);
      return newMap;
    });

    // Save to database
    if (!isCompleted) {
      try {
        await createSetCompletion(
          workoutSessionId,
          exerciseId,
          setNumber,
          set.target_reps,
          set.target_weight
        );

        // Start rest timer if break time is set
        if (set.break_time_seconds && set.break_time_seconds > 0) {
          setActiveTimer({
            exerciseId,
            setNumber,
            breakTime: set.break_time_seconds,
          });
        }
      } catch (error) {
        console.error('Error completing set:', error);
        // Revert optimistic update on error
        setCompletedSets((prev) => {
          const newMap = new Map(prev);
          const exerciseSets = newMap.get(exerciseId) || new Set<number>();
          exerciseSets.delete(setNumber);
          newMap.set(exerciseId, exerciseSets);
          return newMap;
        });
      }
    }
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDayIndex((prev) => {
      if (direction === 'prev') {
        return prev === 0 ? 6 : prev - 1;
      } else {
        return prev === 6 ? 0 : prev + 1;
      }
    });
  };

  const currentDay = workoutDays.find((d) => d.day_of_week === currentDayIndex);
  const isToday = currentDayIndex === new Date().getDay();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.neonPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.header, animatedStyle]}>
        <Text style={styles.title}>Workout Tracker</Text>

        <View style={styles.dayNavigation}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateDay('prev')}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.dayInfo}>
            <Text style={styles.dayLabel}>{isToday ? 'Today' : DAYS[currentDayIndex]}</Text>
            <Text style={styles.workoutType}>
              {currentDay?.workout_type || 'Rest Day'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigateDay('next')}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No exercises scheduled for this day.
            </Text>
          </View>
        ) : (
          exercises.map((exercise, index) => (
            <AnimatedView
              key={exercise.id}
              style={[
                { opacity: opacityAnim.value },
                { transform: [{ translateY: slideAnim.value }] },
              ]}
            >
              <ExerciseCard
                exercise={exercise}
                onSetComplete={handleSetComplete}
                completedSets={completedSets.get(exercise.id) || new Set()}
              />
            </AnimatedView>
          ))
        )}
      </ScrollView>

      {activeTimer && (
        <RestTimer
          breakTime={activeTimer.breakTime}
          onComplete={() => setActiveTimer(null)}
          onDismiss={() => setActiveTimer(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  dayNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: typography.sizes.h1,
    color: colors.neonPrimary,
    fontWeight: typography.weights.bold,
  },
  dayInfo: {
    alignItems: 'center',
    flex: 1,
  },
  dayLabel: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  workoutType: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    color: colors.neonPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  emptyState: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

