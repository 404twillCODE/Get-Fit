// Workout routine initialization utility
// This file contains the default 4-day workout routine

export type ExerciseCategory = "legs" | "arms" | "chest" | "back" | "shoulders" | "core" | "cardio" | "full_body";

export interface Set {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  breakTime?: number;
}

export interface Exercise {
  id: number;
  name: string;
  categories: ExerciseCategory[];
  sets?: Set[];
  selectedDays?: number[];
  notes?: string;
  completed?: boolean;
}

// Helper function to create sets with varying weights/reps
const createSets = (
  sets: Array<{ reps: number; weight: number }>,
  breakTime: number = 60
): Set[] => {
  return sets.map((set, index) => ({
    setNumber: index + 1,
    reps: set.reps,
    weight: set.weight,
    completed: false,
    breakTime,
  }));
};

// Helper to create a single weight/reps pattern
const createUniformSets = (
  count: number,
  reps: number,
  weight: number,
  breakTime: number = 60
): Set[] => {
  return Array.from({ length: count }, (_, i) => ({
    setNumber: i + 1,
    reps,
    weight,
    completed: false,
    breakTime,
  }));
};

// Helper to create sets with failure notation (we'll use a high rep count as placeholder)
const createFailureSet = (weight: number, breakTime: number = 60): Set => ({
  setNumber: 1,
  reps: 999, // Special marker for "failure" - can be adjusted in UI
  weight,
  completed: false,
  breakTime,
});

// Helper to create sets with last set to failure
const createSetsWithFailure = (
  sets: Array<{ reps: number; weight: number }>,
  failureWeight: number,
  breakTime: number = 60
): Set[] => {
  const regularSets = sets.map((set, index) => ({
    setNumber: index + 1,
    reps: set.reps,
    weight: set.weight,
    completed: false,
    breakTime,
  }));
  regularSets.push({
    setNumber: regularSets.length + 1,
    reps: 999, // Failure marker
    weight: failureWeight,
    completed: false,
    breakTime,
  });
  return regularSets;
};

// DAY 1 – PUSH (Chest / Shoulders / Triceps) - Monday (1)
const day1Exercises: Exercise[] = [
  {
    id: 1001,
    name: "Shoulder Press",
    categories: ["shoulders"],
    sets: createUniformSets(4, 20, 60),
    selectedDays: [1],
  },
  {
    id: 1002,
    name: "Chest Press",
    categories: ["chest"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 100).map((s) => ({ reps: s.reps, weight: s.weight })),
      110
    ),
    selectedDays: [1],
  },
  {
    id: 1003,
    name: "Tricep Press",
    categories: ["arms"],
    sets: [
      ...createUniformSets(2, 12, 160),
      ...createUniformSets(2, 10, 120),
      createFailureSet(165),
    ],
    notes: "Cable or Machine",
    selectedDays: [1],
  },
  {
    id: 1004,
    name: "Ab Machine",
    categories: ["core"],
    sets: createUniformSets(4, 20, 120),
    selectedDays: [1],
  },
  {
    id: 1005,
    name: "Ab Crunch",
    categories: ["core"],
    sets: createUniformSets(4, 20, 110),
    selectedDays: [1],
  },
  {
    id: 1006,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [
      {
        setNumber: 1,
        reps: 1,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
    ],
    notes: "15 min",
    selectedDays: [1],
  },
];

// DAY 2 – PULL (Back / Biceps) - Tuesday (2)
const day2Exercises: Exercise[] = [
  {
    id: 2001,
    name: "Lat Pulldown",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 100).map((s) => ({ reps: s.reps, weight: s.weight })),
      120
    ),
    selectedDays: [2],
  },
  {
    id: 2002,
    name: "Seated Row",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 80).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [2],
  },
  {
    id: 2003,
    name: "Bicep Curl Machine",
    categories: ["arms"],
    sets: createSetsWithFailure(
      createUniformSets(3, 10, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [2],
  },
  {
    id: 2004,
    name: "Face Pulls",
    categories: ["back", "shoulders"],
    sets: createUniformSets(3, 15, 0), // Light weight, using 0 as placeholder
    notes: "Optional finisher - light, slow",
    selectedDays: [2],
  },
  {
    id: 2005,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [
      {
        setNumber: 1,
        reps: 1,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
    ],
    notes: "15 min",
    selectedDays: [2],
  },
];

// DAY 3 – LEGS - Wednesday (3)
const day3Exercises: Exercise[] = [
  {
    id: 3001,
    name: "Leg Press",
    categories: ["legs"],
    sets: [
      ...createUniformSets(3, 15, 0), // Moderate weight - using 0 as placeholder
      {
        setNumber: 4,
        reps: 999, // Failure marker
        weight: 0,
        completed: false,
        breakTime: 60,
      },
    ],
    notes: "Moderate weight, 4×15, last set to failure",
    selectedDays: [3],
  },
  {
    id: 3002,
    name: "Seated Leg Curl",
    categories: ["legs"],
    sets: [
      ...createUniformSets(3, 12, 0), // Weight placeholder
      createFailureSet(0), // 1× failure
    ],
    selectedDays: [3],
  },
  {
    id: 3003,
    name: "Leg Extension",
    categories: ["legs"],
    sets: [
      ...createUniformSets(3, 12, 0), // Weight placeholder
      createFailureSet(0), // 1× failure
    ],
    selectedDays: [3],
  },
  {
    id: 3004,
    name: "Calf Raise",
    categories: ["legs"],
    sets: createUniformSets(4, 20, 0), // Standing or Seated
    notes: "Standing or Seated",
    selectedDays: [3],
  },
  {
    id: 3005,
    name: "Plank",
    categories: ["core"],
    sets: [
      {
        setNumber: 1,
        reps: 45, // 45 seconds
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
      {
        setNumber: 2,
        reps: 45,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
      {
        setNumber: 3,
        reps: 45,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
    ],
    notes: "3×45 sec",
    selectedDays: [3],
  },
  {
    id: 3006,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [
      {
        setNumber: 1,
        reps: 1,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
    ],
    notes: "15 min",
    selectedDays: [3],
  },
];

// DAY 4 – FULL UPPER (Strength + Burn) - Thursday (4)
const day4Exercises: Exercise[] = [
  {
    id: 4001,
    name: "Chest Press",
    categories: ["chest"],
    sets: createSetsWithFailure(
      createUniformSets(3, 12, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      100
    ),
    selectedDays: [4],
  },
  {
    id: 4002,
    name: "Lat Pulldown",
    categories: ["back"],
    sets: createSetsWithFailure(
      createUniformSets(3, 12, 90).map((s) => ({ reps: s.reps, weight: s.weight })),
      110
    ),
    selectedDays: [4],
  },
  {
    id: 4003,
    name: "Shoulder Press",
    categories: ["shoulders"],
    sets: createUniformSets(3, 20, 50),
    selectedDays: [4],
  },
  {
    id: 4004,
    name: "Bicep Curl",
    categories: ["arms"],
    sets: createUniformSets(3, 12, 80),
    selectedDays: [4],
  },
  {
    id: 4005,
    name: "Tricep Press",
    categories: ["arms"],
    sets: createUniformSets(3, 12, 140),
    selectedDays: [4],
  },
  {
    id: 4006,
    name: "Ab Machine",
    categories: ["core"],
    sets: createUniformSets(3, 20, 120),
    selectedDays: [4],
  },
  {
    id: 4007,
    name: "Treadmill",
    categories: ["cardio"],
    sets: [
      {
        setNumber: 1,
        reps: 1,
        weight: 0,
        completed: false,
        breakTime: undefined,
      },
    ],
    notes: "15 min",
    selectedDays: [4],
  },
];

export const getDefaultWorkoutRoutine = (): Exercise[] => {
  return [
    ...day1Exercises,
    ...day2Exercises,
    ...day3Exercises,
    ...day4Exercises,
  ];
};

export const getDefaultWorkoutSchedule = (): string[] => {
  return [
    "Rest Day",    // Sunday (0)
    "Push",        // Monday (1) - Chest / Shoulders / Triceps
    "Pull",        // Tuesday (2) - Back / Biceps
    "Legs",        // Wednesday (3)
    "Full Upper",  // Thursday (4) - Strength + Burn
    "Rest Day",    // Friday (5)
    "Rest Day",    // Saturday (6)
  ];
};
