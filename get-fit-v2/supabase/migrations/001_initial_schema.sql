-- Initial database schema for workout tracker
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  setup_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Days table
CREATE TABLE IF NOT EXISTS workout_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, day_of_week)
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Exercise Sets table
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps INTEGER NOT NULL,
  target_weight NUMERIC(10, 2) NOT NULL DEFAULT 0,
  break_time_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(exercise_id, set_number)
);

-- Exercise Day Assignments (many-to-many)
CREATE TABLE IF NOT EXISTS exercise_day_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(exercise_id, workout_day_id)
);

-- Workout Sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  workout_day_id UUID NOT NULL REFERENCES workout_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Set Completions table
CREATE TABLE IF NOT EXISTS set_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  actual_reps INTEGER,
  actual_weight NUMERIC(10, 2),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_days_user_id ON workout_days(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_exercise_id ON exercise_sets(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_day_assignments_exercise_id ON exercise_day_assignments(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_day_assignments_workout_day_id ON exercise_day_assignments(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_day_id ON workout_sessions(workout_day_id);
CREATE INDEX IF NOT EXISTS idx_set_completions_workout_session_id ON set_completions(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_set_completions_exercise_id ON set_completions(exercise_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_days_updated_at BEFORE UPDATE ON workout_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercise_sets_updated_at BEFORE UPDATE ON exercise_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_day_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_completions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Workout Days policies
CREATE POLICY "Users can view own workout days" ON workout_days
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout days" ON workout_days
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout days" ON workout_days
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout days" ON workout_days
  FOR DELETE USING (auth.uid() = user_id);

-- Exercises policies
CREATE POLICY "Users can view own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise Sets policies
CREATE POLICY "Users can view own exercise sets" ON exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_sets.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exercise sets" ON exercise_sets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_sets.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own exercise sets" ON exercise_sets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_sets.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own exercise sets" ON exercise_sets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_sets.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

-- Exercise Day Assignments policies
CREATE POLICY "Users can view own exercise day assignments" ON exercise_day_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_day_assignments.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own exercise day assignments" ON exercise_day_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_day_assignments.exercise_id
      AND exercises.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM workout_days
      WHERE workout_days.id = exercise_day_assignments.workout_day_id
      AND workout_days.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own exercise day assignments" ON exercise_day_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM exercises
      WHERE exercises.id = exercise_day_assignments.exercise_id
      AND exercises.user_id = auth.uid()
    )
  );

-- Workout Sessions policies
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Set Completions policies
CREATE POLICY "Users can view own set completions" ON set_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = set_completions.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own set completions" ON set_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_sessions
      WHERE workout_sessions.id = set_completions.workout_session_id
      AND workout_sessions.user_id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, setup_complete)
  VALUES (NEW.id, FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

