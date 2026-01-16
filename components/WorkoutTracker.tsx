"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { loadAppData, updateAppData } from "@/lib/dataStore";

interface Set {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
}

interface Exercise {
  id: number;
  name: string;
  type: "strength" | "cardio";
  sets?: Set[];
  equipment?: string;
  duration?: number;
  speed?: number;
  incline?: number;
  distance?: number;
  caloriesBurned?: number;
  heartRate?: number;
  notes?: string;
  completed?: boolean;
}

const WorkoutTracker = () => {
  const [currentDayIndex, setCurrentDayIndex] = useState(new Date().getDay());
  const [workouts, setWorkouts] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [workoutSchedule, setWorkoutSchedule] = useState<string[]>(
    Array(7).fill("Rest Day")
  );

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    loadWorkoutSchedule();
    loadDayWorkouts();
  }, []);

  useEffect(() => {
    loadDayWorkouts();
  }, [currentDayIndex]);

  const loadWorkoutSchedule = async () => {
    const data = await loadAppData();
    setWorkoutSchedule(data.workoutSchedule);
  };

  const loadDayWorkouts = async () => {
    const data = await loadAppData();
    const dayWorkouts = data.savedWorkouts[currentDayIndex] || [];
    setWorkouts(dayWorkouts as Exercise[]);
  };

  const saveDayWorkouts = async (nextWorkouts: Exercise[]) => {
    await updateAppData((current) => {
      const savedWorkouts = [...current.savedWorkouts];
      savedWorkouts[currentDayIndex] = [...nextWorkouts];
      return { ...current, savedWorkouts };
    });
  };

  const addExercise = async (exercise: Exercise) => {
    let nextWorkouts: Exercise[] = [];
    if (editingExercise) {
      nextWorkouts = workouts.map((e) =>
        e.id === editingExercise.id ? exercise : e
      );
      setEditingExercise(null);
    } else {
      nextWorkouts = [...workouts, exercise];
    }
    setWorkouts(nextWorkouts);
    await saveDayWorkouts(nextWorkouts);
    setShowModal(false);
  };

  const removeExercise = async (id: number) => {
    const nextWorkouts = workouts.filter((e) => e.id !== id);
    setWorkouts(nextWorkouts);
    await saveDayWorkouts(nextWorkouts);
  };

  const toggleSetComplete = async (exerciseId: number, setIndex: number) => {
    const nextWorkouts = workouts.map((exercise) => {
      if (exercise.id === exerciseId && exercise.sets) {
        const updatedSets = [...exercise.sets];
        updatedSets[setIndex].completed = !updatedSets[setIndex].completed;
        return { ...exercise, sets: updatedSets };
      }
      return exercise;
    });
    setWorkouts(nextWorkouts);
    await saveDayWorkouts(nextWorkouts);
  };

  const toggleExerciseComplete = async (id: number) => {
    const nextWorkouts = workouts.map((e) =>
      e.id === id ? { ...e, completed: !e.completed } : e
    );
    setWorkouts(nextWorkouts);
    await saveDayWorkouts(nextWorkouts);
  };

  const completeWorkout = async () => {
    if (workouts.length === 0) {
      alert("Add at least one exercise before completing the workout");
      return;
    }

    const workoutEntry = {
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
      dayOfWeek: currentDayIndex,
      workoutType: workoutSchedule[currentDayIndex],
      exercises: [...workouts],
    };

    await updateAppData((current) => ({
      ...current,
      workoutHistory: [...current.workoutHistory, workoutEntry],
    }));

    setWorkouts([]);
    await saveDayWorkouts([]);
    alert("Workout completed and saved to history!");
  };

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-5xl mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-center lg:text-left"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-4">Workout Tracker</h1>

        {/* Day Selector */}
        <div className="mb-6">
          <div className="text-white/60 text-sm mb-3 text-center lg:text-left">Select Day</div>
          <div className="flex gap-2 flex-wrap justify-center lg:justify-start">
            {days.map((day, index) => (
              <button
                key={day}
                onClick={() => setCurrentDayIndex(index)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentDayIndex === index
                    ? "bg-white text-[#0a0a0a]"
                    : "bg-white/5 text-white/60 border border-white/10"
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="text-white/60 text-sm mb-2 text-center lg:text-left">
          {days[currentDayIndex]} - {workoutSchedule[currentDayIndex]}
        </div>
      </motion.header>

      {/* Add Exercise Button */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 flex justify-center lg:justify-start">
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
          <div className="space-y-4 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-6 lg:space-y-0">
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
                    {exercise.type === "strength" ? "Strength" : "Cardio"}
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

              {exercise.type === "strength" && exercise.sets && (
                <div className="space-y-2">
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
                      </div>
                      <button
                        onClick={() => toggleSetComplete(exercise.id, index)}
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

              {exercise.type === "cardio" && (
                <div className="space-y-2 text-sm text-white/60">
                  {exercise.equipment && (
                    <div>Equipment: {exercise.equipment}</div>
                  )}
                  {exercise.duration && <div>Duration: {exercise.duration} min</div>}
                  {exercise.distance && <div>Distance: {exercise.distance} miles</div>}
                  {exercise.caloriesBurned && (
                    <div>Calories: {exercise.caloriesBurned}</div>
                  )}
                  <div className="pt-2">
                    <button
                      onClick={() => toggleExerciseComplete(exercise.id)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        exercise.completed
                          ? "bg-green-400 border-green-400"
                          : "border-white/30"
                      }`}
                    >
                      {exercise.completed && "✓"}
                    </button>
                  </div>
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
      />
    </div>
  );
};

interface ExerciseModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  editingExercise: Exercise | null;
}

const ExerciseModal = ({
  show,
  onClose,
  onSave,
  editingExercise,
}: ExerciseModalProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<"strength" | "cardio">("strength");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState("");
  const [equipment, setEquipment] = useState("treadmill");
  const [duration, setDuration] = useState(30);
  const [distance, setDistance] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingExercise) {
      setName(editingExercise.name);
      setType(editingExercise.type);
      if (editingExercise.type === "strength" && editingExercise.sets) {
        setSets(editingExercise.sets.length);
        setReps(editingExercise.sets[0]?.reps || 10);
        setWeight(editingExercise.sets[0]?.weight?.toString() || "");
      } else if (editingExercise.type === "cardio") {
        setEquipment(editingExercise.equipment || "treadmill");
        setDuration(editingExercise.duration || 30);
        setDistance(editingExercise.distance?.toString() || "");
        setCaloriesBurned(editingExercise.caloriesBurned?.toString() || "");
      }
      setNotes(editingExercise.notes || "");
    } else {
      resetForm();
    }
  }, [editingExercise, show]);

  const resetForm = () => {
    setName("");
    setType("strength");
    setSets(3);
    setReps(10);
    setWeight("");
    setEquipment("treadmill");
    setDuration(30);
    setDistance("");
    setCaloriesBurned("");
    setNotes("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter an exercise name");
      return;
    }

    const exercise: Exercise = {
      id: editingExercise?.id || Date.now(),
      name: name.trim(),
      type,
      notes: notes.trim() || undefined,
      completed: false,
    };

    if (type === "strength") {
      exercise.sets = Array.from({ length: sets }, (_, i) => ({
        setNumber: i + 1,
        reps,
        weight: parseFloat(weight) || 0,
        completed: false,
      }));
    } else {
      exercise.equipment = equipment;
      exercise.duration = duration;
      exercise.distance = distance ? parseFloat(distance) : undefined;
      exercise.caloriesBurned = caloriesBurned
        ? parseInt(caloriesBurned)
        : undefined;
    }

    onSave(exercise);
    resetForm();
  };

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 p-6 max-h-[90vh] overflow-y-auto"
      >
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
              Exercise Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "strength" | "cardio")}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
            >
              <option value="strength">Strength Training</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          {type === "strength" && (
            <>
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
            </>
          )}

          {type === "cardio" && (
            <>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Equipment</label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                >
                  <option value="treadmill">Treadmill</option>
                  <option value="elliptical">Elliptical</option>
                  <option value="bike">Stationary Bike</option>
                  <option value="stairmaster">StairMaster</option>
                  <option value="rower">Rowing Machine</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm mb-2 block">
                    Distance (miles)
                  </label>
                  <input
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    step="0.1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">
                  Calories Burned
                </label>
                <input
                  type="number"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
                />
              </div>
            </>
          )}

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
      </motion.div>
    </motion.div>
  );
};

export default WorkoutTracker;



