/**
 * Main setup flow coordinator
 * Guides user through: Day selection → Exercise addition per day → Completion
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SetupDaySelector } from './SetupDaySelector';
import { SetupExerciseAdder } from './SetupExerciseAdder';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';
import { useAuth } from '../auth/AuthProvider';
import {
  createWorkoutDay,
  updateProfileSetupComplete,
} from '../../lib/database';

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

type SetupStep = 'days' | 'exercises' | 'complete';

interface SetupFlowProps {
  onComplete: () => void;
}

export const SetupFlow: React.FC<SetupFlowProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<SetupStep>('days');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [workoutDayIds, setWorkoutDayIds] = useState<Record<number, string>>({});
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());

  const slideAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(1);

  useEffect(() => {
    slideAnim.value = withSpring(0, springConfig.gentle);
    opacityAnim.value = withSpring(1, springConfig.gentle);
  }, [step]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
    opacity: opacityAnim.value,
  }));

  const handleToggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleDaysNext = async () => {
    if (!user || selectedDays.length === 0) return;

    try {
      // Create workout days in database
      const dayIds: Record<number, string> = {};
      for (const dayIndex of selectedDays) {
        const workoutDay = await createWorkoutDay(user.id, dayIndex, null);
        if (workoutDay) {
          dayIds[dayIndex] = workoutDay.id;
        }
      }

      setWorkoutDayIds(dayIds);
      setCurrentDayIndex(selectedDays[0]);
      setStep('exercises');
    } catch (error) {
      console.error('Error creating workout days:', error);
    }
  };

  const handleExerciseComplete = () => {
    if (currentDayIndex === null) return;

    // Mark current day as completed
    setCompletedDays((prev) => new Set([...prev, currentDayIndex!]));

    // Find next uncompleted day
    const nextDay = selectedDays.find(
      (dayIndex) => !completedDays.has(dayIndex) && dayIndex !== currentDayIndex
    );

    if (nextDay !== undefined) {
      setCurrentDayIndex(nextDay);
    } else {
      // All days completed
      handleSetupComplete();
    }
  };

  const handleExerciseBack = () => {
    if (currentDayIndex === null) return;

    // Find previous day
    const currentIndex = selectedDays.indexOf(currentDayIndex);
    if (currentIndex > 0) {
      const prevDay = selectedDays[currentIndex - 1];
      setCurrentDayIndex(prevDay);
      setCompletedDays((prev) => {
        const newSet = new Set(prev);
        newSet.delete(currentDayIndex);
        return newSet;
      });
    } else {
      // Go back to day selection
      setStep('days');
      setCurrentDayIndex(null);
      setCompletedDays(new Set());
    }
  };

  const handleSetupComplete = async () => {
    if (!user) return;

    try {
      await updateProfileSetupComplete(user.id, true);
      setStep('complete');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error('Error completing setup:', error);
    }
  };

  if (step === 'days') {
    return (
      <SetupDaySelector
        selectedDays={selectedDays}
        onToggleDay={handleToggleDay}
        onNext={handleDaysNext}
      />
    );
  }

  if (step === 'exercises' && currentDayIndex !== null) {
    const workoutDayId = workoutDayIds[currentDayIndex];
    if (!workoutDayId) return null;

    return (
      <SetupExerciseAdder
        dayIndex={currentDayIndex}
        dayName={DAYS[currentDayIndex]}
        workoutDayId={workoutDayId}
        onComplete={handleExerciseComplete}
        onBack={handleExerciseBack}
      />
    );
  }

  if (step === 'complete') {
    return (
      <AnimatedView style={[styles.completeContainer, animatedStyle]}>
        <Text style={styles.completeEmoji}>🎉</Text>
        <Text style={styles.completeTitle}>You're All Set!</Text>
        <Text style={styles.completeSubtitle}>
          Your workout tracker is ready. You can always add more exercises or modify your schedule later.
        </Text>
      </AnimatedView>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  completeContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  completeEmoji: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  completeTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
  },
});

