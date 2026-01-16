// Utility function to format date as YYYY-MM-DD using local time (not UTC)
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type DeficitEntry = {
  date: string;
  nutrition?: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  fitness?: {
    totalCalories: number;
  };
  caloriesEaten: number;
  caloriesBurned: number;
  deficit: number;
};

export type WorkoutHistoryEntry = {
  date: string;
  timestamp: number;
  dayOfWeek: number;
  workoutType?: string;
  exercises: unknown[];
};

export type AppData = {
  deficitEntries: DeficitEntry[];
  savedWorkouts: unknown[][];
  workoutHistory: WorkoutHistoryEntry[];
  workoutSchedule: string[];
};

export const STORAGE_KEYS = [
  "deficitEntries",
  "savedWorkouts",
  "workoutHistory",
  "workoutSchedule",
] as const;

const safeJsonParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getDefaultData = (): AppData => ({
  deficitEntries: [],
  savedWorkouts: Array.from({ length: 7 }, () => []),
  workoutHistory: [],
  workoutSchedule: Array(7).fill("Rest Day"),
});

export const getLocalData = (): AppData => {
  const fallback = getDefaultData();
  return {
    deficitEntries: safeJsonParse<DeficitEntry[]>(
      localStorage.getItem("deficitEntries"),
      fallback.deficitEntries
    ),
    savedWorkouts: safeJsonParse<unknown[][]>(
      localStorage.getItem("savedWorkouts"),
      fallback.savedWorkouts
    ),
    workoutHistory: safeJsonParse<WorkoutHistoryEntry[]>(
      localStorage.getItem("workoutHistory"),
      fallback.workoutHistory
    ),
    workoutSchedule: safeJsonParse<string[]>(
      localStorage.getItem("workoutSchedule"),
      fallback.workoutSchedule
    ),
  };
};

export const setLocalData = (data: AppData) => {
  localStorage.setItem("deficitEntries", JSON.stringify(data.deficitEntries));
  localStorage.setItem("savedWorkouts", JSON.stringify(data.savedWorkouts));
  localStorage.setItem("workoutHistory", JSON.stringify(data.workoutHistory));
  localStorage.setItem("workoutSchedule", JSON.stringify(data.workoutSchedule));
};

export const getAllStorageData = (): Record<string, unknown> => {
  const data = getLocalData();
  return STORAGE_KEYS.reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = data[key as keyof AppData];
    return acc;
  }, {});
};
