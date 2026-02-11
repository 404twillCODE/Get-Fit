/**
 * Exercise database for autocomplete suggestions
 */

import type { ExerciseCategory } from './types';

export const exerciseDatabase: Record<ExerciseCategory, string[]> = {
  chest: [
    'Bench Press', 'Incline Bench Press', 'Decline Bench Press', 'Dumbbell Press',
    'Incline Dumbbell Press', 'Decline Dumbbell Press', 'Cable Fly', 'Pec Deck Machine',
    'Push-ups', 'Dips', 'Chest Press Machine', 'Smith Machine Bench Press',
    'Chest Fly Machine', 'Pec Deck', 'Cable Crossover', 'Dumbbell Flyes',
    'Incline Cable Fly', 'Decline Cable Fly', 'Flat Chest Press Machine',
    'Incline Chest Press Machine', 'Decline Chest Press Machine', 'Cable Chest Press',
    'Smith Machine Incline Press', 'Smith Machine Decline Press', 'Dumbbell Pullover',
    'Cable Pullover', 'Push-up Variations', 'Diamond Push-ups', 'Wide Push-ups',
    'Incline Push-ups', 'Decline Push-ups', 'Chest Dips', 'Assisted Dips',
  ],
  back: [
    'Pull-ups', 'Lat Pulldown', 'Barbell Row', 'Dumbbell Row', 'Cable Row',
    'Seated Row Machine', 'T-Bar Row', 'Bent Over Row', 'One-Arm Row',
    'Wide Grip Pulldown', 'Close Grip Pulldown', 'Reverse Grip Pulldown',
    'Reverse Fly', 'Face Pull', 'Shrugs', 'Deadlift', 'Rack Pull',
    'Hyperextension', 'Cable Lat Pulldown', 'Cable High Row', 'Cable Low Row',
    'Seated Cable Row', 'Standing Cable Row', 'Wide Grip Cable Row',
    'Close Grip Cable Row', 'Cable Face Pull', 'Cable Reverse Fly',
    'Smith Machine Row', 'Smith Machine Shrugs', 'Dumbbell Shrugs',
    'Barbell Shrugs', 'Cable Shrugs', 'Hyperextension Machine',
    'Back Extension Machine', 'Assisted Pull-ups', 'Lat Pulldown Machine',
    'Seated Row Machine', 'Cable Reverse Fly', 'Cable Upright Row',
  ],
  shoulders: [
    'Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Front Raise',
    'Rear Delt Fly', 'Arnold Press', 'Cable Lateral Raise', 'Face Pull',
    'Upright Row', 'Shrugs', 'Reverse Fly', 'Shoulder Press Machine',
    'Pike Push-ups', 'Handstand Push-ups', 'Cable Rear Delt Fly',
    'Lateral Raise Machine', 'Rear Deltoid Machine', 'Shoulder Press Machine',
    'Smith Machine Shoulder Press', 'Cable Shoulder Press', 'Dumbbell Lateral Raise',
    'Cable Front Raise', 'Barbell Front Raise', 'Dumbbell Front Raise',
    'Cable Upright Row', 'Barbell Upright Row', 'Dumbbell Upright Row',
    'Reverse Pec Deck', 'Rear Delt Machine', 'Cable Lateral Raise',
    'Dumbbell Rear Delt Fly', 'Cable Rear Delt Fly', 'Face Pull Machine',
    'Shoulder Press Machine', 'Overhead Press Machine', 'Pike Push-ups',
    'Wall Handstand Push-ups', 'Dumbbell Arnold Press', 'Cable Arnold Press',
  ],
  legs: [
    'Squats', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Romanian Deadlift',
    'Bulgarian Split Squat', 'Lunges', 'Walking Lunges', 'Calf Raises',
    'Hack Squat', 'Smith Machine Squat', 'Goblet Squat', 'Step-ups',
    'Leg Press Machine', 'Seated Calf Raise', 'Standing Calf Raise', 'Hip Thrust',
    'Leg Extension Machine', 'Seated Leg Curl', 'Lying Leg Curl',
    'Standing Leg Curl', 'Hack Squat Machine', 'Smith Machine Lunges',
    'Dumbbell Lunges', 'Barbell Lunges', 'Reverse Lunges', 'Side Lunges',
    'Curtsy Lunges', 'Jump Lunges', 'Leg Press 45 Degree', 'Leg Press Horizontal',
    'Seated Leg Press', 'Calf Raise Machine', 'Seated Calf Raise Machine',
    'Standing Calf Raise Machine', 'Smith Machine Calf Raises', 'Hip Abductor Machine',
    'Hip Adductor Machine', 'Glute Kickback Machine', 'Leg Press Machine',
    'Smith Machine Leg Press', 'Dumbbell Step-ups', 'Box Step-ups',
    'Romanian Deadlift Machine', 'Smith Machine RDL', 'Dumbbell RDL',
    'Barbell RDL', 'Good Mornings', 'Smith Machine Good Mornings',
    'Hip Thrust Machine', 'Glute Bridge', 'Single Leg Press', 'Pistol Squats',
  ],
  arms: [
    'Bicep Curl', 'Hammer Curl', 'Tricep Extension', 'Tricep Dips',
    'Cable Curl', 'Preacher Curl', 'Concentration Curl', 'Overhead Tricep Extension',
    'Close Grip Bench Press', 'Skull Crushers', 'Cable Tricep Pushdown',
    'Barbell Curl', 'Dumbbell Curl', 'Tricep Kickback', 'Rope Cable Curl',
    'Bicep Curl Machine', 'Preacher Curl Machine', 'Tricep Extension Machine',
    'Cable Bicep Curl', 'Cable Hammer Curl', 'Cable Preacher Curl',
    'Cable Concentration Curl', 'Dumbbell Hammer Curl', 'Barbell Hammer Curl',
    'Cable Tricep Extension', 'Overhead Cable Tricep Extension', 'Dumbbell Tricep Extension',
    'Dumbbell Overhead Extension', 'Cable Overhead Extension', 'Rope Tricep Pushdown',
    'Straight Bar Tricep Pushdown', 'Close Grip Cable Press', 'Smith Machine Close Grip Press',
    'Dumbbell Skull Crushers', 'Cable Skull Crushers', 'Tricep Dips Machine',
    'Assisted Tricep Dips', 'Cable Tricep Kickback', 'Dumbbell Tricep Kickback',
    'Reverse Grip Cable Curl', 'Cable Reverse Curl', 'Barbell Reverse Curl',
    'Dumbbell Reverse Curl', '21s Bicep Curls', 'Cable 21s', 'Spider Curls',
    'Cable Spider Curls', 'Incline Dumbbell Curl', 'Standing Cable Curl',
    'Seated Cable Curl', 'Cable Rope Hammer Curl',
  ],
  core: [
    'Plank', 'Crunches', 'Sit-ups', 'Russian Twists', 'Leg Raises',
    'Mountain Climbers', 'Bicycle Crunches', 'Dead Bug', 'Hollow Hold',
    'Ab Wheel', 'Cable Crunch', 'Hanging Leg Raise', 'Side Plank',
    'Reverse Crunch', 'Flutter Kicks', 'V-Ups', 'Dragon Flag',
    'Ab Crunch Machine', 'Abdominal Crunch Machine', 'Torso Rotation Machine',
    'Roman Chair', 'Roman Chair Sit-ups', 'Roman Chair Leg Raises',
    'Cable Crunch', 'Cable Woodchopper', 'Cable Side Crunch', 'Cable Reverse Crunch',
    'Cable Leg Raise', 'Hanging Knee Raises', 'Hanging Leg Raises',
    'Hanging Windshield Wipers', 'Plank Variations', 'Side Plank',
    'Reverse Plank', 'Plank to Pike', 'Plank Jacks', 'Mountain Climbers',
    'Bicycle Crunches', 'Reverse Crunches', 'Flutter Kicks', 'Scissor Kicks',
    'Dead Bug', 'Hollow Hold', 'V-Ups', 'Dragon Flag', 'Ab Wheel Rollout',
    'Cable Ab Crunch', 'Cable Oblique Crunch', 'Russian Twists', 'Weighted Russian Twists',
    'Medicine Ball Crunches', 'Stability Ball Crunches', 'Decline Crunches',
    'Incline Crunches', 'Reverse Crunch Machine', 'Ab Coaster', 'Ab Crunch Bench',
  ],
  cardio: [
    'Running', 'Treadmill', 'Elliptical', 'Bike', 'Rowing Machine',
    'Stair Climber', 'Jump Rope', 'Burpees', 'High Knees', 'Jumping Jacks',
    'Boxing', 'Swimming', 'Cycling', 'HIIT', 'Sprint Intervals',
    'Treadmill Walking', 'Treadmill Jogging', 'Treadmill Running', 'Treadmill Incline',
    'Elliptical Trainer', 'Elliptical Cross Trainer', 'ARC Trainer',
    'Stationary Bike', 'Upright Bike', 'Recumbent Bike', 'Rowing Machine',
    'Concept2 Rower', 'Stair Climber', 'StepMill', 'Stepper Machine',
    'Recumbent Stepper', 'Low Impact Stepper', 'Jump Rope', 'Jumping Rope',
    'Burpees', 'High Knees', 'Jumping Jacks', 'Mountain Climbers',
    'Boxing Bag', 'Heavy Bag', 'Speed Bag', 'Swimming', 'Pool Swimming',
    'Cycling', 'Indoor Cycling', 'HIIT Cardio', 'Sprint Intervals',
    'Tabata', 'Circuit Training', 'Interval Training', 'Steady State Cardio',
    'LISS Cardio', 'Walking', 'Power Walking', 'Jogging', 'Running',
    'Treadmill Intervals', 'Elliptical Intervals', 'Bike Intervals',
    'Rowing Intervals', 'Stair Climber Intervals', 'Jump Rope Intervals',
  ],
  full_body: [
    'Burpees', 'Thrusters', 'Clean and Press', 'Kettlebell Swing',
    'Turkish Get-up', 'Man Makers', 'Bear Crawl', 'Mountain Climbers',
    'Jump Squats', 'Box Jumps', 'Battle Ropes', 'Sled Push',
    'Full Body Circuit', 'Compound Movements', 'Clean and Jerk',
    'Snatch', 'Power Clean', 'Deadlift', 'Squat to Press', 'Dumbbell Thrusters',
    'Barbell Thrusters', 'Kettlebell Thrusters', 'Turkish Get-ups',
    'Man Makers', 'Bear Crawl', 'Crab Walk', 'Duck Walk', 'Jump Squats',
    'Box Jumps', 'Plyometric Box Jumps', 'Battle Ropes', 'Sled Push',
    'Farmers Walk', 'Suitcase Carry', 'Overhead Carry', 'Rowing Machine',
    'Full Body Rowing', 'Cable Full Body', 'Smith Machine Full Body',
    'Circuit Training', 'HIIT Full Body', 'Tabata Full Body',
    'Full Body Dumbbell', 'Full Body Barbell', 'Full Body Kettlebell',
  ],
};

export const getAllExercises = (): string[] => {
  return Object.values(exerciseDatabase).flat();
};

export const getExercisesByCategory = (category: ExerciseCategory): string[] => {
  return exerciseDatabase[category] || [];
};

export const searchExercises = (query: string, categories?: ExerciseCategory[]): string[] => {
  const searchTerm = query.toLowerCase();
  const exercisesToSearch = categories
    ? categories.flatMap((cat) => exerciseDatabase[cat] || [])
    : getAllExercises();

  return exercisesToSearch
    .filter((exercise) => exercise.toLowerCase().includes(searchTerm))
    .slice(0, 10); // Limit to 10 results
};

