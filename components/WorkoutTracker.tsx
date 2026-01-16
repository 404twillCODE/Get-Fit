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

interface Exercise {
  id: number;
  name: string;
  category: "legs" | "arms" | "chest" | "back" | "shoulders" | "core" | "cardio" | "full_body";
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
    loadWorkoutSchedule();
    loadDayWorkouts();
  }, []);

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
    const data = await loadAppData();
    // Get workouts for current day directly (they're already organized by day)
    const dayWorkouts = (data.savedWorkouts[currentDayIndex] || []) as Exercise[];
    
    // Remove duplicates by using a Map with exercise.id as key (safety check)
    const uniqueWorkouts = Array.from(
      new Map(dayWorkouts.map((exercise) => [exercise.id, exercise])).values()
    );
    setWorkouts(uniqueWorkouts);
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
    if (editingExercise) {
      // Update existing exercise - update it in the workout map
      await updateAppData((current) => {
        const savedWorkouts: Exercise[][] = Array.from({ length: 7 }, () => []);
        
        // Rebuild the arrays with the updated exercise
        for (let day = 0; day < 7; day++) {
          const dayWorkouts = (current.savedWorkouts[day] || []) as Exercise[];
          savedWorkouts[day] = dayWorkouts.map((e) =>
            e.id === editingExercise.id ? exercise : e
          );
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
    setShowModal(false);
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
        <div className="px-4 sm:px-6 lg:px-8 mb-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-4 text-center"
          >
            <div className="text-blue-400 text-sm mb-2">Break Time</div>
            <div className="text-3xl font-bold text-white">
              {formatTime(activeBreakTimer.timeLeft)}
            </div>
            <button
              onClick={() => setActiveBreakTimer(null)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Dismiss
            </button>
          </motion.div>
        </div>
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
  const [category, setCategory] = useState<Exercise["category"]>("legs");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState("");
  const [breakTime, setBreakTime] = useState(60); // Default 60 seconds
  const [selectedDays, setSelectedDays] = useState<number[]>([currentDayIndex]);
  const [notes, setNotes] = useState("");

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
      setCategory(editingExercise.category);
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
    setCategory("legs");
    setSets(3);
    setReps(10);
    setWeight("");
    setBreakTime(60);
    setSelectedDays([currentDayIndex]);
    setNotes("");
  };

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }

    const exercise: Exercise = {
      id: editingExercise?.id || Date.now(),
      name: name.trim(),
      category,
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

    onSave(exercise);
    resetForm();
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md lg:max-w-lg bg-[#0a0a0a] rounded-3xl border border-white/20 p-6 lg:p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingExercise ? "Edit Exercise" : "Add Exercise"}
                </h2>
                <button onClick={onClose} className="text-2xl">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Bench Press"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Exercise["category"])}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Select Days
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {days.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => toggleDay(index)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedDays.includes(index)
                            ? "bg-white text-[#0a0a0a]"
                            : "bg-white/5 text-white/60 border border-white/10"
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Sets</label>
                    <input
                      type="number"
                      value={sets}
                      onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Reps</label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-white/60 text-sm mb-2 block">Weight</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="lbs"
                      step="2.5"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Break Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={breakTime}
                    onChange={(e) => setBreakTime(parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="0 for no break"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                  <div className="text-xs text-white/40 mt-1">
                    Timer will start when you complete a set
                  </div>
                </div>

                <div>
                  <label className="text-white/60 text-sm mb-2 block">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white min-h-[80px]"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="w-full py-4 bg-white text-[#0a0a0a] rounded-2xl font-semibold text-lg mt-6"
                >
                  {editingExercise ? "Update Exercise" : "Save Exercise"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkoutTracker;
