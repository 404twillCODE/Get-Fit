/**
 * Database helper functions
 */

import { getSupabaseClient } from './supabase';
import type {
  Profile,
  WorkoutDay,
  Exercise,
  ExerciseSet,
  ExerciseDayAssignment,
  WorkoutSession,
  SetCompletion,
  ExerciseWithSets,
  WorkoutDayWithExercises,
} from './types';

// Profile operations
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

export const updateProfileSetupComplete = async (
  userId: string,
  setupComplete: boolean
): Promise<boolean> => {
  const { error } = await getSupabaseClient()
    .from('profiles')
    .update({ setup_complete: setupComplete, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }

  return true;
};

// Workout Day operations
export const getWorkoutDays = async (userId: string): Promise<WorkoutDay[]> => {
  const { data, error } = await getSupabaseClient()
    .from('workout_days')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching workout days:', error);
    return [];
  }

  return data || [];
};

export const createWorkoutDay = async (
  userId: string,
  dayOfWeek: number,
  workoutType: string | null = null
): Promise<WorkoutDay | null> => {
  const { data, error } = await getSupabaseClient()
    .from('workout_days')
    .insert({
      user_id: userId,
      day_of_week: dayOfWeek,
      workout_type: workoutType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workout day:', error);
    return null;
  }

  return data;
};

export const updateWorkoutDay = async (
  workoutDayId: string,
  workoutType: string | null
): Promise<boolean> => {
  const { error } = await getSupabaseClient()
    .from('workout_days')
    .update({ workout_type: workoutType, updated_at: new Date().toISOString() })
    .eq('id', workoutDayId);

  if (error) {
    console.error('Error updating workout day:', error);
    return false;
  }

  return true;
};

// Exercise operations
export const createExercise = async (
  userId: string,
  name: string,
  categories: string[],
  notes: string | null = null
): Promise<Exercise | null> => {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .insert({
      user_id: userId,
      name,
      categories,
      notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating exercise:', error);
    return null;
  }

  return data;
};

export const getExercises = async (userId: string): Promise<Exercise[]> => {
  const { data, error } = await getSupabaseClient()
    .from('exercises')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching exercises:', error);
    return [];
  }

  return data || [];
};

// Exercise Set operations
export const createExerciseSets = async (
  exerciseId: string,
  sets: Array<{
    set_number: number;
    target_reps: number;
    target_weight: number;
    break_time_seconds: number | null;
  }>
): Promise<ExerciseSet[]> => {
  const setsData = sets.map((set) => ({
    exercise_id: exerciseId,
    ...set,
  }));

  const { data, error } = await getSupabaseClient()
    .from('exercise_sets')
    .insert(setsData)
    .select();

  if (error) {
    console.error('Error creating exercise sets:', error);
    return [];
  }

  return data || [];
};

export const getExerciseSets = async (exerciseId: string): Promise<ExerciseSet[]> => {
  const { data, error } = await getSupabaseClient()
    .from('exercise_sets')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: true });

  if (error) {
    console.error('Error fetching exercise sets:', error);
    return [];
  }

  return data || [];
};

// Exercise Day Assignment operations
export const assignExerciseToDay = async (
  exerciseId: string,
  workoutDayId: string
): Promise<ExerciseDayAssignment | null> => {
  const { data, error } = await getSupabaseClient()
    .from('exercise_day_assignments')
    .insert({
      exercise_id: exerciseId,
      workout_day_id: workoutDayId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error assigning exercise to day:', error);
    return null;
  }

  return data;
};

export const getExercisesForDay = async (
  workoutDayId: string
): Promise<ExerciseWithSets[]> => {
  const { data, error } = await getSupabaseClient()
    .from('exercise_day_assignments')
    .select(
      `
      exercise:exercises (
        *,
        sets:exercise_sets (*)
      )
    `
    )
    .eq('workout_day_id', workoutDayId);

  if (error) {
    console.error('Error fetching exercises for day:', error);
    return [];
  }

  // Transform the nested data structure
  const exercises = (data || []).map((item: any) => ({
    ...item.exercise,
    sets: item.exercise.sets || [],
  }));

  return exercises;
};

// Workout Session operations
export const createWorkoutSession = async (
  userId: string,
  workoutDayId: string
): Promise<WorkoutSession | null> => {
  const { data, error } = await getSupabaseClient()
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_day_id: workoutDayId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating workout session:', error);
    return null;
  }

  return data;
};

export const completeWorkoutSession = async (
  sessionId: string
): Promise<boolean> => {
  const { error } = await getSupabaseClient()
    .from('workout_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('Error completing workout session:', error);
    return false;
  }

  return true;
};

// Set Completion operations
export const createSetCompletion = async (
  workoutSessionId: string,
  exerciseId: string,
  setNumber: number,
  actualReps: number | null = null,
  actualWeight: number | null = null
): Promise<SetCompletion | null> => {
  const { data, error } = await getSupabaseClient()
    .from('set_completions')
    .insert({
      workout_session_id: workoutSessionId,
      exercise_id: exerciseId,
      set_number: setNumber,
      actual_reps: actualReps,
      actual_weight: actualWeight,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating set completion:', error);
    return null;
  }

  return data;
};

