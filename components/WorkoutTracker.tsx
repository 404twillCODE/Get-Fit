"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { loadAppData, updateAppData } from "@/lib/dataStore";
import { formatDateKey } from "@/lib/storage";

interface Set {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  breakTime?: number; // Break time in seconds
}

type ExerciseCategory = "legs" | "arms" | "chest" | "back" | "shoulders" | "core" | "cardio" | "full_body";

interface Exercise {
  id: number;
  name: string;
  categories: ExerciseCategory[]; // Multiple categories allowed
  sets?: Set[];
  selectedDays?: number[]; // Days of week (0-6) where this exercise appears
  notes?: string;
  completed?: boolean;
}

const WorkoutTracker = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay());
  const [workouts, setWorkouts] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [activeBreakTimer, setActiveBreakTimer] = useState<{ exerciseId: number; setIndex: number; timeLeft: number } | null>(null);
  const [workoutSchedule, setWorkoutSchedule] = useState<string[]>(
    Array(7).fill("Rest Day")
  );
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const categories = [
    { value: "legs", label: "Legs" },
    { value: "arms", label: "Arms" },
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "core", label: "Core" },
    { value: "cardio", label: "Cardio" },
    { value: "full_body", label: "Full Body" },
  ];

  useEffect(() => {
    checkWorkoutSetup();
    loadWorkoutSchedule();
    loadDayWorkouts();
  }, []);

  const checkWorkoutSetup = async () => {
    try {
      const data = await loadAppData();
      const hasExercises = data.savedWorkouts.some((day) => Array.isArray(day) && day.length > 0);
      const hasSchedule = data.workoutSchedule.some((day) => day !== "Rest Day");
      
      // Show setup if no exercises and no schedule, or if setup not marked complete
      if (!data.workoutSetupComplete && (!hasExercises || !hasSchedule)) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error("Error checking workout setup:", error);
    }
  };

  useEffect(() => {
    loadDayWorkouts();
  }, [currentDayIndex]);

  // Break timer countdown
  useEffect(() => {
    if (activeBreakTimer && activeBreakTimer.timeLeft > 0) {
      const timer = setTimeout(() => {
        setActiveBreakTimer({
          ...activeBreakTimer,
          timeLeft: activeBreakTimer.timeLeft - 1,
        });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeBreakTimer && activeBreakTimer.timeLeft === 0) {
      // Timer finished, play sound or notification
      setTimeout(() => {
        setActiveBreakTimer(null);
      }, 1000);
    }
  }, [activeBreakTimer]);

  const loadWorkoutSchedule = async () => {
    const data = await loadAppData();
    setWorkoutSchedule(data.workoutSchedule);
  };

  const loadDayWorkouts = async () => {
    try {
      const data = await loadAppData();
      // Get workouts for current day directly (they're already organized by day)
      const dayWorkouts = (data.savedWorkouts[currentDayIndex] || []) as any[];
      
      // Migrate old exercises with single category to categories array
      const migratedWorkouts = dayWorkouts.map((exercise) => {
        // Ensure categories array exists
        if (!exercise.categories) {
          if ((exercise as any).category) {
            return {
              ...exercise,
              categories: [(exercise as any).category],
            } as Exercise;
          } else {
            // Default to legs if no category at all
            return {
              ...exercise,
              categories: ["legs"],
            } as Exercise;
          }
        }
        // Ensure categories is an array
        if (!Array.isArray(exercise.categories)) {
          return {
            ...exercise,
            categories: [exercise.categories],
          } as Exercise;
        }
        return exercise as Exercise;
      });
      
      // Remove duplicates by using a Map with exercise.id as key (safety check)
      const uniqueWorkouts = Array.from(
        new Map(migratedWorkouts.map((exercise) => [exercise.id, exercise])).values()
      );
      setWorkouts(uniqueWorkouts);
    } catch (error) {
      console.error("Error loading workouts:", error);
      setWorkouts([]);
    }
  };

  const saveDayWorkouts = async (updatedWorkouts: Exercise[]) => {
    // Save all workouts, not just current day
    await updateAppData((current) => {
      // Get all unique workouts from all days
      const allWorkouts = current.savedWorkouts.flat() as Exercise[];
      const workoutMap = new Map<number, Exercise>();
      
      // Add existing workouts to map (deduplicated by ID)
      allWorkouts.forEach((w) => {
        if (!workoutMap.has(w.id)) {
          workoutMap.set(w.id, w);
        }
      });
      
      // Update or add workouts from the updated list
      updatedWorkouts.forEach((workout) => {
        workoutMap.set(workout.id, workout);
      });
      
      // Reorganize by selected days - create fresh arrays
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      workoutMap.forEach((workout) => {
        if (!workout.selectedDays || workout.selectedDays.length === 0) {
          // Add to all days if no selection
          for (let i = 0; i < 7; i++) {
            savedWorkouts[i].push(workout);
          }
        } else {
          workout.selectedDays.forEach((day) => {
            savedWorkouts[day].push(workout);
          });
        }
      });
      
      return { ...current, savedWorkouts };
    });
  };

  const addExercise = async (exercise: Exercise) => {
    try {
      // Add timeout protection
      const savePromise = (async () => {
        if (editingExercise) {
          // Update existing exercise - remove from all days first, then add to new days
          await updateAppData((current) => {
            const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
            
            // First, remove the exercise from all days
            for (let day = 0; day < 7; day++) {
              const dayWorkouts = (current.savedWorkouts[day] || []) as any[];
              savedWorkouts[day] = dayWorkouts.filter((e) => {
                // Handle both old and new format
                const eId = e.id;
                return eId !== editingExercise.id;
              }) as Exercise[];
            }
            
            // Then add the updated exercise to the appropriate days
            if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
              // Add to all days if no selection
              for (let i = 0; i < 7; i++) {
                savedWorkouts[i] = [...savedWorkouts[i], exercise];
              }
            } else {
              // Add to selected days only
              exercise.selectedDays.forEach((day) => {
                savedWorkouts[day] = [...savedWorkouts[day], exercise];
              });
            }
            
            return { ...current, savedWorkouts };
          });
          setEditingExercise(null);
        } else {
          // Add new exercise - add it to the appropriate days
          await updateAppData((current) => {
            const savedWorkouts = [...current.savedWorkouts];
            
            if (!exercise.selectedDays || exercise.selectedDays.length === 0) {
              // Add to all days if no selection
              for (let i = 0; i < 7; i++) {
                savedWorkouts[i] = [...(savedWorkouts[i] || []), exercise];
              }
            } else {
              // Add to selected days only
              exercise.selectedDays.forEach((day) => {
                savedWorkouts[day] = [...(savedWorkouts[day] || []), exercise];
              });
            }
            
            return { ...current, savedWorkouts };
          });
        }
        await loadDayWorkouts(); // Reload to show updated list
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
      setShowModal(false);
    } catch (error) {
      console.error("Error saving exercise:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      alert(errorMsg.includes("timeout") 
        ? "Save is taking longer than expected. Please try again." 
        : "Failed to save exercise. Please try again.");
      throw error; // Re-throw so handleSave can catch it
    }
  };

  const removeExercise = async (id: number) => {
    await updateAppData((current) => {
      const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
      
      // Remove the exercise from all days
      for (let day = 0; day < 7; day++) {
        const dayWorkouts = (current.savedWorkouts[day] || []) as Exercise[];
        savedWorkouts[day] = dayWorkouts.filter((e) => e.id !== id);
      }
      
      return { ...current, savedWorkouts };
    });
    await loadDayWorkouts();
  };

  const toggleSetComplete = async (exerciseId: number, setIndex: number, breakTime?: number) => {
    const allData = await loadAppData();
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      if (exercise.id === exerciseId && exercise.sets) {
        const updatedSets = [...exercise.sets];
        updatedSets[setIndex].completed = !updatedSets[setIndex].completed;
        if (breakTime && updatedSets[setIndex].completed && !updatedSets[setIndex].breakTime) {
          updatedSets[setIndex].breakTime = breakTime;
        }
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
    
    // Start break timer if set was completed and break time is set
    const exercise = updatedWorkouts.find((e) => e.id === exerciseId);
    if (exercise?.sets?.[setIndex]?.completed && exercise.sets[setIndex].breakTime) {
      setActiveBreakTimer({
        exerciseId,
        setIndex,
        timeLeft: exercise.sets[setIndex].breakTime!,
      });
    }
  };

  const selectAllSets = async (exerciseId: number) => {
    const allData = await loadAppData();
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      if (exercise.id === exerciseId && exercise.sets) {
        const allCompleted = exercise.sets.every((set) => set.completed);
        const updatedSets = exercise.sets.map((set) => ({
          ...set,
          completed: !allCompleted,
        }));
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const toggleExerciseComplete = async (id: number) => {
    const allData = await loadAppData();
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((e) =>
      e.id === id ? { ...e, completed: !e.completed } : e
    );
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const resetDayProgress = async () => {
    const allData = await loadAppData();
    const allWorkouts = allData.savedWorkouts.flat() as Exercise[];
    const updatedWorkouts = allWorkouts.map((exercise) => {
      // Only reset exercises that appear on current day
      const appearsToday = !exercise.selectedDays || exercise.selectedDays.length === 0 || exercise.selectedDays.includes(currentDayIndex);
      if (appearsToday && exercise.sets) {
        const resetSets = exercise.sets.map((set) => ({
          ...set,
          completed: false,
        }));
        return { ...exercise, sets: resetSets, completed: false };
      }
      return exercise;
    });
    await saveDayWorkouts(updatedWorkouts);
    await loadDayWorkouts();
  };

  const completeWorkout = async () => {
    if (workouts.length === 0) {
      alert("Add at least one exercise before completing the workout");
      return;
    }

    const workoutEntry = {
      date: formatDateKey(new Date()),
      timestamp: Date.now(),
      dayOfWeek: currentDayIndex,
      workoutType: workoutSchedule[currentDayIndex],
      exercises: [...workouts],
    };

    await updateAppData((current) => ({
      ...current,
      workoutHistory: [...current.workoutHistory, workoutEntry],
    }));

    // Reset progress but keep workouts
    await resetDayProgress();
    alert("Workout completed and saved to history! Progress has been reset.");
  };

  const navigateDay = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDayIndex((prev) => (prev === 0 ? 6 : prev - 1));
    } else {
      setCurrentDayIndex((prev) => (prev === 6 ? 0 : prev + 1));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isToday = currentDayIndex === new Date().getDay();
  const getDateLabel = () => {
    if (isToday) return "Today";
    const today = new Date();
    const dayDiff = currentDayIndex - today.getDay();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayDiff);
    return targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-5xl mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-center">Workout Tracker</h1>

        {/* Day Navigation */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            onClick={() => navigateDay("prev")}
            className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Previous day"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="text-center min-w-[200px]">
            <div className="text-white/60 text-sm mb-1">{getDateLabel()}</div>
            <div className="text-xl font-semibold">
              {days[currentDayIndex]} - {workoutSchedule[currentDayIndex]}
            </div>
          </div>
          <button
            onClick={() => navigateDay("next")}
            className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Next day"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </motion.header>

      {/* Break Timer Display */}
      {activeBreakTimer && (
        <AnimatePresence>
          <motion.div
            key="break-timer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 250 }}
              className="w-full max-w-sm rounded-3xl border border-blue-500/30 bg-[#0a0a0a] p-6 text-center shadow-2xl"
            >
              <div className="text-blue-400 text-xs uppercase tracking-[0.2em] mb-3">
                Break Time
              </div>
              <div className="text-5xl font-bold text-white mb-2">
                {formatTime(activeBreakTimer.timeLeft)}
              </div>
              <div className="text-white/60 text-sm mb-5">
                Reset and get ready for your next set.
              </div>
              <button
                onClick={() => setActiveBreakTimer(null)}
                className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Add Exercise Button */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingExercise(null);
            setShowModal(true);
          }}
          className="w-full lg:w-auto lg:px-8 py-4 bg-white text-[#0a0a0a] rounded-2xl font-semibold text-lg"
        >
          + Add Exercise
        </motion.button>
      </div>

      {/* Exercise List */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6">
        {workouts.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            No exercises added yet. Click &quot;Add Exercise&quot; to get started!
          </div>
        ) : (
          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 lg:max-w-4xl lg:mx-auto">
            <AnimatePresence>
              {workouts.map((exercise) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg lg:text-xl font-semibold mb-1 truncate">{exercise.name}</h3>
                      <span className="text-xs lg:text-sm text-white/60 bg-white/5 px-2 py-1 rounded inline-block">
                        {categories.find((c) => c.value === exercise.category)?.label || exercise.category}
                      </span>
                    </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingExercise(exercise);
                          setShowModal(true);
                        }}
                        className="text-white/60 hover:text-white text-lg lg:text-xl transition-colors"
                        aria-label="Edit exercise"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-400 hover:text-red-300 text-lg lg:text-xl transition-colors"
                        aria-label="Delete exercise"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {exercise.sets && exercise.sets.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-white/60 text-sm">Sets</div>
                        <button
                          onClick={() => selectAllSets(exercise.id)}
                          className="text-xs text-white/60 hover:text-white bg-white/5 px-2 py-1 rounded"
                        >
                          Select All
                        </button>
                      </div>
                      {exercise.sets.map((set, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-white/60 text-sm w-8">
                              Set {set.setNumber}
                            </span>
                            <span className="text-white/80">
                              {set.reps} reps × {set.weight > 0 ? `${set.weight} lbs` : "bodyweight"}
                            </span>
                            {set.breakTime && (
                              <span className="text-xs text-white/40">
                                ({formatTime(set.breakTime)} break)
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => toggleSetComplete(exercise.id, index, set.breakTime)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                              set.completed
                                ? "bg-green-400 border-green-400"
                                : "border-white/30"
                            }`}
                          >
                            {set.completed && "✓"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-sm text-white/60">
                      {exercise.notes}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Complete Workout Button */}
      {workouts.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 mb-6 pb-20 sm:pb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={completeWorkout}
            className="w-full lg:w-auto lg:px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl font-semibold text-lg"
          >
            Complete Workout
          </motion.button>
        </div>
      )}

      {/* Exercise Modal */}
      <ExerciseModal
        show={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExercise(null);
        }}
        onSave={addExercise}
        editingExercise={editingExercise}
        currentDayIndex={currentDayIndex}
      />

      {/* Workout Setup Modal */}
      <WorkoutSetupModal
        show={showSetup}
        onComplete={async () => {
          await updateAppData((current) => ({
            ...current,
            workoutSetupComplete: true,
          }));
          setShowSetup(false);
          await loadWorkoutSchedule();
          await loadDayWorkouts();
        }}
        onAddExercise={(dayIndex) => {
          // This will be handled inside the setup modal
        }}
        workoutSchedule={workoutSchedule}
        setWorkoutSchedule={setWorkoutSchedule}
        currentDayIndex={currentDayIndex}
        setCurrentDayIndex={setCurrentDayIndex}
      />
    </div>
  );
};

interface ExerciseModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  editingExercise: Exercise | null;
  currentDayIndex: number;
}

const ExerciseModal = ({
  show,
  onClose,
  onSave,
  editingExercise,
  currentDayIndex,
}: ExerciseModalProps) => {
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ExerciseCategory[]>(["legs"]);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState("");
  const [breakTime, setBreakTime] = useState(60); // Default 60 seconds
  const [selectedDays, setSelectedDays] = useState<number[]>([currentDayIndex]);
  const [notes, setNotes] = useState("");
  const [isSavingExercise, setIsSavingExercise] = useState(false);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const categories = [
    { value: "legs", label: "Legs" },
    { value: "arms", label: "Arms" },
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "core", label: "Core" },
    { value: "cardio", label: "Cardio" },
    { value: "full_body", label: "Full Body" },
  ];

  useEffect(() => {
    if (editingExercise) {
      setName(editingExercise.name);
      // Handle migration from old single category to categories array
      if (editingExercise.categories && editingExercise.categories.length > 0) {
        setSelectedCategories(editingExercise.categories);
      } else if ((editingExercise as any).category) {
        setSelectedCategories([(editingExercise as any).category]);
      } else {
        setSelectedCategories(["legs"]);
      }
      if (editingExercise.sets) {
        setSets(editingExercise.sets.length);
        setReps(editingExercise.sets[0]?.reps || 10);
        setWeight(editingExercise.sets[0]?.weight?.toString() || "");
        setBreakTime(editingExercise.sets[0]?.breakTime || 60);
      }
      setSelectedDays(editingExercise.selectedDays || [currentDayIndex]);
      setNotes(editingExercise.notes || "");
    } else {
      resetForm();
    }
  }, [editingExercise, show, currentDayIndex]);

  const resetForm = () => {
    setName("");
    setSelectedCategories(["legs"]);
    setSets(3);
    setReps(10);
    setWeight("");
    setBreakTime(60);
    setSelectedDays([currentDayIndex]);
    setNotes("");
  };

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSave = async () => {
    if (isSavingExercise) {
      return; // Prevent duplicate saves
    }

    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }

    setIsSavingExercise(true);
    
    try {
      const exercise: Exercise = {
        id: editingExercise?.id || Date.now(),
        name: name.trim(),
        categories: selectedCategories.length > 0 ? selectedCategories : ["legs"],
        notes: notes.trim() || undefined,
        completed: false,
        selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
        sets: Array.from({ length: sets }, (_, i) => ({
          setNumber: i + 1,
          reps,
          weight: parseFloat(weight) || 0,
          completed: false,
          breakTime: breakTime > 0 ? breakTime : undefined,
        })),
      };

      // Add timeout protection
      const savePromise = Promise.resolve(onSave(exercise));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
      resetForm();
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("Failed to save exercise. Please try again.");
    } finally {
      setIsSavingExercise(false);
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
          >
            <div className="bg-[#0a0a0a] rounded-3xl p-5 lg:p-6 border border-white/20 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {editingExercise ? "Edit Exercise" : "Add Exercise"}
                  </h3>
                  <p className="text-white/60 text-xs">
                    {editingExercise ? "Update exercise details" : "Create a new exercise"}
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-white/60 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bench Press"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Categories (Select Multiple)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleCategory(cat.value as ExerciseCategory)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedCategories.includes(cat.value as ExerciseCategory)
                            ? "bg-white text-[#0a0a0a] font-medium"
                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {selectedCategories.length === 0 && (
                    <div className="text-xs text-yellow-400 mt-1.5">
                      Please select at least one category
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Select Days
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {days.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(index)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          selectedDays.includes(index)
                            ? "bg-white text-[#0a0a0a] font-medium"
                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">Weight (lbs)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="lbs"
                      step="2.5"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">
                    Break Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={breakTime}
                    onChange={(e) => setBreakTime(parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="0 for no break"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                  />
                  <div className="text-xs text-white/50 mt-1">
                    Timer will start when you complete a set
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none min-h-[60px] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSavingExercise}
                  className="flex-1 py-2.5 bg-white text-[#0a0a0a] rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 text-sm"
                >
                  {isSavingExercise ? "Saving..." : editingExercise ? "Update" : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface WorkoutSetupModalProps {
  show: boolean;
  onComplete: () => void;
  onAddExercise: (dayIndex: number) => void;
  workoutSchedule: string[];
  setWorkoutSchedule: (schedule: string[]) => void;
  currentDayIndex: number;
  setCurrentDayIndex: (index: number) => void;
}

const WorkoutSetupModal = ({
  show,
  onComplete,
  onAddExercise,
  workoutSchedule,
  setWorkoutSchedule,
  currentDayIndex,
  setCurrentDayIndex,
}: WorkoutSetupModalProps) => {
  const [step, setStep] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [workoutTypes, setWorkoutTypes] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseModalDayIndex, setExerciseModalDayIndex] = useState<number | null>(null);
  const [setupExercises, setSetupExercises] = useState<Record<number, Exercise[]>>({});

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const workoutTypeOptions = [
    "Push",
    "Pull",
    "Legs",
    "Arms",
    "Chest",
    "Back",
    "Shoulders",
    "Core",
    "Cardio",
    "Full Body",
    "Upper Body",
    "Lower Body",
    "Rest Day",
  ];

  useEffect(() => {
    if (show) {
      setStep(1);
      setSelectedDays([]);
      setWorkoutTypes({});
      setIsSaving(false);
      setSetupExercises({});
    }
  }, [show]);

  useEffect(() => {
    if (!show || step !== 3 || selectedDays.length === 0) return;
    let isMounted = true;
    const loadSetupExercises = async () => {
      try {
        const data = await loadAppData();
        if (!isMounted) return;
        const next: Record<number, Exercise[]> = {};
        selectedDays.forEach((day) => {
          next[day] = (data.savedWorkouts[day] || []) as Exercise[];
        });
        setSetupExercises(next);
      } catch (error) {
        console.error("Error loading setup exercises:", error);
      }
    };
    loadSetupExercises();
    return () => {
      isMounted = false;
    };
  }, [show, step, selectedDays]);

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleNextFromDays = () => {
    if (selectedDays.length === 0) {
      return;
    }
    setStep(2);
  };

  const toggleWorkoutType = (dayIndex: number, workoutType: string) => {
    setWorkoutTypes((prev) => {
      const currentTypes = prev[dayIndex] || [];
      const isSelected = currentTypes.includes(workoutType);
      return {
        ...prev,
        [dayIndex]: isSelected
          ? currentTypes.filter((t) => t !== workoutType)
          : [...currentTypes, workoutType],
      };
    });
  };

  const handleSaveWorkoutTypes = async () => {
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      const currentData = await loadAppData();
      const newSchedule = [...(currentData.workoutSchedule || Array(7).fill("Rest Day"))];
      selectedDays.forEach((day) => {
        const types = workoutTypes[day] || [];
        newSchedule[day] = types.length > 0 ? types.join(" + ") : "Workout";
      });
      await updateAppData((current) => ({
        ...current,
        workoutSchedule: newSchedule,
      }));
      setWorkoutSchedule(newSchedule);
      setStep(3);
    } catch (error) {
      console.error("Error saving workout types:", error);
      alert("Failed to save workout types. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = async () => {
    await onComplete();
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="workout-setup-wrapper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {}}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-3xl border border-white/20 p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Progress Indicator */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white/60">
                    Step {step} of 4
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <div
                        key={s}
                        className={`h-2 w-8 rounded-full transition-colors ${
                          s <= step ? "bg-white" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 1: Select Days */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">💪</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                      Select Your Workout Days
                    </h2>
                    <p className="text-white/60 text-sm lg:text-base">
                      Which days of the week do you work out?
                    </p>
                  </div>

                  <div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {days.map((day, index) => (
                        <button
                          key={day}
                          onClick={() => toggleDay(index)}
                          className={`py-4 rounded-xl text-sm font-medium transition-all ${
                            selectedDays.includes(index)
                              ? "bg-white text-[#0a0a0a]"
                              : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {selectedDays.length === 0 && (
                      <div className="text-xs text-yellow-400 mt-3 text-center">
                        Please select at least one workout day
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleNextFromDays}
                      disabled={selectedDays.length === 0}
                      className="flex-1 py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Select Workout Types */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                      What Are You Doing Those Days?
                    </h2>
                    <p className="text-white/60 text-sm lg:text-base">
                      Select one or more workout types for each day. You can select multiple types per day.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedDays.map((dayIndex) => (
                      <div
                        key={dayIndex}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <h3 className="font-semibold mb-3">{days[dayIndex]}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {workoutTypeOptions.map((type) => {
                            const isSelected = (workoutTypes[dayIndex] || []).includes(type);
                            return (
                              <button
                                key={type}
                                onClick={() => toggleWorkoutType(dayIndex, type)}
                                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? "bg-white text-[#0a0a0a]"
                                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                                }`}
                              >
                                {type}
                              </button>
                            );
                          })}
                        </div>
                        {(workoutTypes[dayIndex] || []).length === 0 && (
                          <div className="text-xs text-yellow-400 mt-2">
                            Please select at least one workout type
                          </div>
                        )}
                        {(workoutTypes[dayIndex] || []).length > 0 && (
                          <div className="text-xs text-white/60 mt-2">
                            Selected: {(workoutTypes[dayIndex] || []).join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSaveWorkoutTypes}
                      disabled={
                        selectedDays.some((day) => !workoutTypes[day] || workoutTypes[day].length === 0) || isSaving
                      }
                      className="flex-1 py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
                    >
                      {isSaving ? "Saving..." : "Next"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Add Exercises */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏋️</div>
                    <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                      Add Your Exercises
                    </h2>
                    <p className="text-white/60 text-sm lg:text-base">
                      Now let's add exercises to your workout days. You can add more later!
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedDays.map((dayIndex) => (
                      <div
                        key={dayIndex}
                        className="bg-white/5 rounded-xl p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{days[dayIndex]}</h3>
                          <span className="text-xs text-white/60">
                            {(workoutTypes[dayIndex] && workoutTypes[dayIndex].length > 0)
                              ? workoutTypes[dayIndex].join(" + ")
                              : workoutSchedule[dayIndex] || "Workout"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setExerciseModalDayIndex(dayIndex);
                            setShowExerciseModal(true);
                          }}
                          className="w-full py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition-colors"
                        >
                          + Add Exercise
                        </button>
                        {(setupExercises[dayIndex] || []).length > 0 && (
                          <div className="mt-3 space-y-2">
                            {(setupExercises[dayIndex] || []).map((exercise) => (
                              <div
                                key={`${exercise.id}-${dayIndex}`}
                                className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{exercise.name}</div>
                                  <div className="text-xs text-white/60 truncate">
                                    {(exercise.categories || []).join(", ")} • {exercise.sets?.length || 0} sets
                                  </div>
                                </div>
                                <div className="text-xs text-white/50 ml-3">
                                  {exercise.sets?.[0]?.reps ? `${exercise.sets[0].reps} reps` : ""}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold"
                    >
                      Next
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 4 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 text-center"
                >
                  <div className="text-4xl mb-4">🎉</div>
                  <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-white/60 text-sm lg:text-base mb-6">
                    Your workout tracker is ready. You can always add more exercises or modify your schedule later.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold"
                    >
                      Start Tracking!
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Setup Exercise Modal - appears within setup flow */}
      {showExerciseModal && exerciseModalDayIndex !== null && (
        <SetupExerciseModal
          key={`setup-exercise-${exerciseModalDayIndex}`}
          show={showExerciseModal}
          dayIndex={exerciseModalDayIndex}
          onClose={() => {
            setShowExerciseModal(false);
            setExerciseModalDayIndex(null);
          }}
          onSave={async (exercise) => {
            try {
              // Save exercise to the specific day
              const allData = await loadAppData();
              const newSavedWorkouts = [...allData.savedWorkouts];
              const dayWorkouts = (newSavedWorkouts[exerciseModalDayIndex!] || []) as Exercise[];
              newSavedWorkouts[exerciseModalDayIndex!] = [...dayWorkouts, exercise];
              
              // Add timeout protection
              const savePromise = updateAppData((current) => ({
                ...current,
                savedWorkouts: newSavedWorkouts,
              }));

              const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Save timeout")), 10000)
              );

              await Promise.race([savePromise, timeoutPromise]);
              setSetupExercises((prev) => ({
                ...prev,
                [exerciseModalDayIndex!]: [
                  ...(prev[exerciseModalDayIndex!] || []),
                  exercise,
                ],
              }));

              setShowExerciseModal(false);
              setExerciseModalDayIndex(null);
            } catch (error) {
              console.error("Error saving exercise in setup:", error);
              alert("Failed to save exercise. Please try again.");
            }
          }}
        />
      )}
    </AnimatePresence>
  );
};

interface SetupExerciseModalProps {
  show: boolean;
  dayIndex: number | null;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
}

const SetupExerciseModal = ({
  show,
  dayIndex,
  onClose,
  onSave,
}: SetupExerciseModalProps) => {
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<ExerciseCategory[]>(["legs"]);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState("");
  const [breakTime, setBreakTime] = useState(60);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const categories = [
    { value: "legs", label: "Legs" },
    { value: "arms", label: "Arms" },
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "shoulders", label: "Shoulders" },
    { value: "core", label: "Core" },
    { value: "cardio", label: "Cardio" },
    { value: "full_body", label: "Full Body" },
  ];

  useEffect(() => {
    if (show) {
      setName("");
      setSelectedCategories(["legs"]);
      setSets(3);
      setReps(10);
      setWeight("");
      setBreakTime(60);
      setNotes("");
    }
  }, [show]);

  const toggleCategory = (category: ExerciseCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSave = async () => {
    if (isSaving) {
      return; // Prevent duplicate saves
    }

    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one category");
      return;
    }
    if (dayIndex === null) {
      return;
    }

    setIsSaving(true);

    try {
      const exercise: Exercise = {
        id: Date.now(),
        name: name.trim(),
        categories: selectedCategories.length > 0 ? selectedCategories : ["legs"],
        notes: notes.trim() || undefined,
        completed: false,
        selectedDays: [dayIndex],
        sets: Array.from({ length: sets }, (_, i) => ({
          setNumber: i + 1,
          reps,
          weight: parseFloat(weight) || 0,
          completed: false,
          breakTime,
        })),
      };

      // Add timeout protection
      const savePromise = onSave(exercise);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timeout")), 10000)
      );

      await Promise.race([savePromise, timeoutPromise]);
      
      onClose(); // Close modal after successful save
    } catch (error) {
      console.error("Error saving exercise:", error);
      alert("Failed to save exercise. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!show || dayIndex === null) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-[#0a0a0a] rounded-3xl p-5 lg:p-6 border border-white/20 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Add Exercise</h3>
            <p className="text-white/60 text-xs">
              {days[dayIndex]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-white/70 mb-1 block">
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Bench Press"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">
              Categories *
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.value as ExerciseCategory);
                return (
                  <button
                    key={cat.value}
                    onClick={() => toggleCategory(cat.value as ExerciseCategory)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? "bg-white text-[#0a0a0a] font-medium"
                        : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/70 mb-1 block">Sets</label>
              <input
                type="number"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">Reps</label>
              <input
                type="number"
                value={reps}
                onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">Weight (lbs)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0"
                step="2.5"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">
              Break Time (seconds)
            </label>
            <input
              type="number"
              value={breakTime}
              onChange={(e) => setBreakTime(parseInt(e.target.value) || 0)}
              min="0"
              placeholder="0 for no break"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
            />
            <div className="text-xs text-white/50 mt-1">
              Timer will start when you complete a set
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none min-h-[60px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-white text-[#0a0a0a] rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 text-sm"
          >
            {isSaving ? "Saving..." : "Add Exercise"}
          </button>
        </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkoutTracker;
