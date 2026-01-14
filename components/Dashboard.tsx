"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [todayCalories, setTodayCalories] = useState({ eaten: 0, burned: 0 });
  const [todayWorkouts, setTodayWorkouts] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<boolean[]>(
    Array(7).fill(false)
  );

  useEffect(() => {
    // Load today's deficit data
    const deficitData = localStorage.getItem("deficitEntries");
    if (deficitData) {
      const entries = JSON.parse(deficitData);
      const today = new Date().toISOString().split("T")[0];
      const todayEntry = entries.find((e: any) => e.date === today);
      if (todayEntry) {
        setTodayCalories({
          eaten: todayEntry.caloriesEaten || 0,
          burned: todayEntry.caloriesBurned || 0,
        });
      }
    }

    // Load today's workout data
    const workoutData = localStorage.getItem("savedWorkouts");
    if (workoutData) {
      const workouts = JSON.parse(workoutData);
      const todayIndex = new Date().getDay();
      const todayWorkout = workouts[todayIndex] || [];
      setTodayWorkouts(todayWorkout.length);

      // Load weekly workout data
      const weekly = workouts.map((w: any[]) => (w?.length || 0) > 0);
      setWeeklyWorkouts(weekly);
    }
  }, []);

  const deficit = todayCalories.eaten - todayCalories.burned;

  const copyDailyLog = () => {
    const today = new Date();
    const todayKey = today.toISOString().split("T")[0];
    const todayIndex = today.getDay();
    const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
    const dateStr = today.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    let logText = `📊 Daily Log - ${dayName}, ${dateStr}\n\n`;

    // Get nutrition data
    const deficitData = localStorage.getItem("deficitEntries");
    if (deficitData) {
      const entries = JSON.parse(deficitData);
      const todayEntry = entries.find((e: any) => e.date === todayKey);
      if (todayEntry) {
        logText += `🔥 NUTRITION\n`;
        if (todayEntry.nutrition) {
          const n = todayEntry.nutrition;
          logText += `Calories: ${n.calories}\n`;
          if (n.fat > 0) logText += `Fat: ${n.fat}g\n`;
          if (n.carbs > 0) logText += `Carbs: ${n.carbs}g\n`;
          if (n.protein > 0) logText += `Protein: ${n.protein}g\n`;
          if (n.fiber > 0) logText += `Fiber: ${n.fiber}g\n`;
          if (n.sodium > 0) logText += `Sodium: ${n.sodium}mg\n`;
          if (n.calcium > 0) logText += `Calcium: ${n.calcium}mg\n`;
        }
        logText += `\n`;
      }
    }

    // Get fitness data
    const deficitData2 = localStorage.getItem("deficitEntries");
    if (deficitData2) {
      const entries = JSON.parse(deficitData2);
      const todayEntry = entries.find((e: any) => e.date === todayKey);
      if (todayEntry && todayEntry.fitness) {
        const f = todayEntry.fitness;
        logText += `⌚ ACTIVITY\n`;
        if (f.totalCalories > 0) logText += `Total Calories: ${f.totalCalories}\n`;
        if (f.exercise) logText += `Exercise: ${f.exercise}\n`;
        if (f.standHours > 0) logText += `Stand Hours: ${f.standHours}\n`;
        if (f.steps > 0) logText += `Steps: ${f.steps.toLocaleString()}\n`;
        if (f.distance > 0) logText += `Distance: ${f.distance} miles\n`;
        logText += `\n`;
      }
    }

    // Get completed workouts
    const workoutData = localStorage.getItem("savedWorkouts");
    if (workoutData) {
      const workouts = JSON.parse(workoutData);
      const todayWorkout = workouts[todayIndex] || [];
      const completedExercises = todayWorkout.filter((ex: any) => {
        if (ex.type === "strength" && ex.sets) {
          return ex.sets.some((set: any) => set.completed);
        }
        return ex.completed;
      });

      if (completedExercises.length > 0) {
        logText += `💪 WORKOUT\n`;
        completedExercises.forEach((exercise: any) => {
          logText += `\n${exercise.name} (${exercise.type === "strength" ? "Strength" : "Cardio"})\n`;
          
          if (exercise.type === "strength" && exercise.sets) {
            const completedSets = exercise.sets.filter((set: any) => set.completed);
            completedSets.forEach((set: any) => {
              logText += `  Set ${set.setNumber}: ${set.reps} reps × ${set.weight > 0 ? `${set.weight} lbs` : "bodyweight"}\n`;
            });
          } else if (exercise.type === "cardio") {
            if (exercise.equipment) logText += `  Equipment: ${exercise.equipment}\n`;
            if (exercise.duration) logText += `  Duration: ${exercise.duration} min\n`;
            if (exercise.distance) logText += `  Distance: ${exercise.distance} miles\n`;
            if (exercise.caloriesBurned) logText += `  Calories: ${exercise.caloriesBurned}\n`;
          }
          
          if (exercise.notes) logText += `  Notes: ${exercise.notes}\n`;
        });
        logText += `\n`;
      }
    }

    // Add summary
    const logDeficit = todayCalories.eaten - todayCalories.burned;
    logText += `📈 SUMMARY\n`;
    logText += `Calories Eaten: ${todayCalories.eaten}\n`;
    logText += `Calories Burned: ${todayCalories.burned}\n`;
    logText += `Deficit: ${logDeficit >= 0 ? "+" : ""}${Math.round(logDeficit)}\n`;

    // Copy to clipboard
    navigator.clipboard.writeText(logText).then(() => {
      alert("Daily log copied to clipboard! 📋");
    }).catch((err) => {
      console.error("Failed to copy:", err);
      alert("Failed to copy log. Please try again.");
    });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-8 px-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
          Get Fit
        </h1>
        <p className="text-white/60 text-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.header>

      {/* Quick Stats */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-3xl p-6 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-2">Today&apos;s Deficit</div>
          <div
            className={`text-4xl font-bold ${
              deficit <= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {deficit >= 0 ? "+" : ""}
            {Math.round(deficit).toLocaleString()}
          </div>
          <div className="text-white/40 text-xs mt-2">
            {todayCalories.burned} burned - {todayCalories.eaten} eaten
          </div>
        </motion.div>
      </div>

      {/* Copy Log Button */}
      <div className="px-6 mb-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyDailyLog}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          <span>📋</span>
          <span>Copy Daily Log</span>
        </motion.button>
      </div>

      {/* Quick Actions */}
      <div className="px-6 space-y-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/calories">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 active:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm mb-1">Deficit Calculator</div>
                  <div className="text-xl font-semibold">
                    {todayCalories.eaten > 0 || todayCalories.burned > 0
                      ? "Update Today"
                      : "Log Data"}
                  </div>
                </div>
                <div className="text-3xl">🔥</div>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/workouts">
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 active:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white/60 text-sm mb-1">Workout Routine</div>
                  <div className="text-xl font-semibold">
                    {todayWorkouts > 0
                      ? `${todayWorkouts} Exercise${todayWorkouts !== 1 ? "s" : ""}`
                      : "Start Workout"}
                  </div>
                </div>
                <div className="text-3xl">💪</div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Weekly Progress */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-4">This Week</div>
          <div className="flex justify-between items-end gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
              const dayIndex = index;
              const hasWorkout = weeklyWorkouts[dayIndex] || false;
              const isToday = dayIndex === new Date().getDay();

              return (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      hasWorkout
                        ? "bg-gradient-to-t from-blue-500/60 to-blue-500/40 h-8"
                        : "bg-white/5 h-2"
                    } ${isToday ? "ring-2 ring-white/30" : ""}`}
                  />
                  <div
                    className={`text-xs mt-2 ${isToday ? "text-white" : "text-white/40"}`}
                  >
                    {day}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

