/**
 * TypeScript types for database tables
 */

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sunday = 0, Saturday = 6

export type ExerciseCategory =
  | 'legs'
  | 'arms'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'core'
  | 'cardio'
  | 'full_body';

// Database table types
export interface Profile {
  id: string;
  setup_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  id: string;
  user_id: string;
  day_of_week: DayOfWeek;
  workout_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  name: string;
  categories: ExerciseCategory[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  target_reps: number;
  target_weight: number;
  break_time_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExerciseDayAssignment {
  id: string;
  exercise_id: string;
  workout_day_id: string;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_day_id: string;
  completed_at: string | null;
  created_at: string;
}

export interface SetCompletion {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  set_number: number;
  actual_reps: number | null;
  actual_weight: number | null;
  completed_at: string;
}

// UI types
export interface ExerciseWithSets extends Exercise {
  sets: ExerciseSet[];
  workout_day_ids?: string[];
}

export interface WorkoutDayWithExercises extends WorkoutDay {
  exercises: ExerciseWithSets[];
}

