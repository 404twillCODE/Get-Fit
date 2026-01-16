"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  getDefaultData,
  type AppData,
  type DeficitEntry,
  type WorkoutHistoryEntry,
} from "@/lib/storage";
import {
  loadAppData,
  resetToDefaults,
} from "@/lib/dataStore";

const Insights = () => {
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState("");
  const { user, isGuest, signOut } = useAuth();
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set([new Date().toISOString().split("T")[0]]));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [copyOptions, setCopyOptions] = useState({
    includeDate: true,
    includeNutrition: true,
    includeCalories: true,
    includeFat: true,
    includeCarbs: true,
    includeProtein: true,
    includeFitness: true,
    includeWorkouts: true,
    includeSummary: true,
  });

  const loadData = async () => {
    const data = await loadAppData();
    setEntries(data.deficitEntries);
    setHistory(data.workoutHistory);
    setSchedule(data.workoutSchedule);
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const weekEntries = sortedEntries.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate >= last7Days;
    });

    const weeklyAverage =
      weekEntries.length > 0
        ? Math.round(
            weekEntries.reduce((sum, entry) => sum + entry.deficit, 0) /
              weekEntries.length
          )
        : 0;

    // Calculate total deficit (negative values mean calories burned > eaten)
    const totalDeficit = sortedEntries.reduce((sum, entry) => sum + entry.deficit, 0);
    
    // Approximate weight loss: 1 lb = ~3,500 calories deficit
    // Negative deficit means weight loss, so we flip the sign
    const approximateWeightLoss = totalDeficit < 0 
      ? Math.abs(totalDeficit) / 3500 
      : 0;
    const approximateWeightGain = totalDeficit > 0 
      ? totalDeficit / 3500 
      : 0;

    const streak = (() => {
      if (sortedEntries.length === 0) return 0;
      const entryDates = new Set(sortedEntries.map((entry) => entry.date));
      let count = 0;
      const cursor = new Date();
      cursor.setHours(0, 0, 0, 0);

      while (true) {
        const cursorKey = cursor.toISOString().split("T")[0];
        if (!entryDates.has(cursorKey)) break;
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      return count;
    })();

    const lastWorkout = [...history].sort(
      (a, b) => b.timestamp - a.timestamp
    )[0];

    const workoutsLast7Days = history.filter((workout) => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= last7Days;
    }).length;

    const todayIndex = new Date().getDay();
    const plannedToday = schedule[todayIndex] || "Rest Day";

    return {
      totalLoggedDays: sortedEntries.length,
      weeklyAverage,
      streak,
      lastWorkout,
      workoutsLast7Days,
      plannedToday,
      approximateWeightLoss,
      approximateWeightGain,
      totalDeficit,
    };
  }, [entries, history, schedule]);

  const handleClearAll = async () => {
    const confirmation = prompt(
      "Type CLEAR to delete all local Get Fit data."
    );
    if (confirmation !== "CLEAR") return;
    await resetToDefaults();
    await loadData();
  };

  const toggleDateSelection = (dateKey: string) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateKey)) {
      newSelected.delete(dateKey);
    } else {
      newSelected.add(dateKey);
    }
    setSelectedDates(newSelected);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const copyDailyLog = async () => {
    if (selectedDates.size === 0) {
      setSyncStatus("Please select at least one date.");
      setTimeout(() => setSyncStatus(""), 3000);
      return;
    }

    const data = await loadAppData();
    const sortedDates = Array.from(selectedDates).sort();
    let logText = "";

    sortedDates.forEach((dateKey) => {
      const selectedDateObj = new Date(dateKey);
      const selectedDayIndex = selectedDateObj.getDay();
      const dayName = selectedDateObj.toLocaleDateString("en-US", { weekday: "long" });
      const dateStr = selectedDateObj.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (copyOptions.includeDate) {
        logText += `📊 Daily Log - ${dayName}, ${dateStr}\n\n`;
      }

      const selectedEntry = data.deficitEntries.find(
        (entry) => entry.date === dateKey
      );

      if (copyOptions.includeNutrition && selectedEntry?.nutrition) {
        logText += `🔥 NUTRITION\n`;
        const n = selectedEntry.nutrition;
        if (copyOptions.includeCalories) logText += `Calories: ${n.calories}\n`;
        if (copyOptions.includeCarbs && n.carbs > 0) logText += `Carbs: ${n.carbs}g\n`;
        if (copyOptions.includeProtein && n.protein > 0) logText += `Protein: ${n.protein}g\n`;
        if (copyOptions.includeFat && n.fat > 0) logText += `Fat: ${n.fat}g\n`;
        logText += `\n`;
      }

      if (copyOptions.includeFitness && selectedEntry?.fitness) {
        const f = selectedEntry.fitness;
        logText += `⌚ ACTIVITY\n`;
        if (f.totalCalories > 0) logText += `Total Calories: ${f.totalCalories}\n`;
        logText += `\n`;
      }

      if (copyOptions.includeWorkouts && data.savedWorkouts.length > 0) {
        const selectedWorkout = data.savedWorkouts[selectedDayIndex] || [];
        const completedExercises = selectedWorkout.filter((exercise: any) => {
          if (exercise.type === "strength" && exercise.sets) {
            return exercise.sets.some((set: any) => set.completed);
          }
          return exercise.completed;
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

      if (copyOptions.includeSummary && selectedEntry) {
        const logDeficit = (selectedEntry.caloriesEaten || 0) - (selectedEntry.caloriesBurned || 0);
        logText += `📈 SUMMARY\n`;
        logText += `Calories Eaten: ${selectedEntry.caloriesEaten || 0}\n`;
        logText += `Calories Burned: ${selectedEntry.caloriesBurned || 0}\n`;
        logText += `Deficit: ${logDeficit >= 0 ? "+" : ""}${Math.round(logDeficit)}\n`;
      }

      // Add separator between days (except for the last one)
      if (dateKey !== sortedDates[sortedDates.length - 1]) {
        logText += `\n${"=".repeat(40)}\n\n`;
      }
    });

    // Copy to clipboard
    navigator.clipboard.writeText(logText).then(() => {
      setSyncStatus(`Log copied to clipboard! 📋 (${selectedDates.size} day${selectedDates.size !== 1 ? "s" : ""})`);
      setTimeout(() => setSyncStatus(""), 3000);
      setShowCopyModal(false);
    }).catch((err) => {
      console.error("Failed to copy:", err);
      setSyncStatus("Failed to copy log. Please try again.");
      setTimeout(() => setSyncStatus(""), 3000);
    });
  };

  const lastWorkoutDate = stats.lastWorkout
    ? new Date(stats.lastWorkout.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "No workouts yet";

  return (
    <div className="max-w-md lg:max-w-2xl xl:max-w-4xl mx-auto min-h-screen bg-[#0a0a0a]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-6"
      >
        <h1 className="text-3xl font-bold mb-2">Insights & Data</h1>
        <p className="text-white/60 text-sm">
          Track streaks, trends, and manage your data.
        </p>
      </motion.header>

      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-4">Daily Momentum</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-white/5 py-3 px-2 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Streak</div>
              <div className="text-lg font-semibold">{stats.streak} days</div>
            </div>
            <div className="rounded-xl bg-white/5 py-3 px-2 border border-white/10">
              <div className="text-xs text-white/50 mb-1">7-Day Avg</div>
              <div
                className={`text-lg font-semibold ${
                  stats.weeklyAverage < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.weeklyAverage >= 0 ? "+" : ""}
                {stats.weeklyAverage}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 py-3 px-2 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Days Logged</div>
              <div className="text-lg font-semibold">{stats.totalLoggedDays}</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-4">Weight Loss Estimate</div>
          <div className="space-y-3 text-sm text-white/80">
            {stats.approximateWeightLoss > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-white/50">Approximate Weight Loss</span>
                <span className="text-green-400 font-semibold">
                  {stats.approximateWeightLoss.toFixed(2)} lbs
                </span>
              </div>
            ) : stats.approximateWeightGain > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-white/50">Approximate Weight Gain</span>
                <span className="text-red-400 font-semibold">
                  +{stats.approximateWeightGain.toFixed(2)} lbs
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-white/50">Weight Change</span>
                <span className="text-white/60">No change</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-white/50">Total Deficit</span>
              <span
                className={`font-semibold ${
                  stats.totalDeficit < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.totalDeficit >= 0 ? "+" : ""}
                {Math.round(stats.totalDeficit).toLocaleString()} cal
              </span>
            </div>
            <div className="text-xs text-white/40 mt-2 pt-2 border-t border-white/10">
              * Based on 3,500 calories = 1 lb of fat
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-4">Workout Trends</div>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between">
              <span className="text-white/50">Planned Today</span>
              <span>{stats.plannedToday}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">Workouts (7 days)</span>
              <span>{stats.workoutsLast7Days}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">Last Completed</span>
              <span>{lastWorkoutDate}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 rounded-2xl p-5 border border-white/10"
        >
          <div className="text-white/60 text-sm mb-4">Data Tools</div>
          <div className="flex items-center justify-between text-xs text-white/50 mb-4">
            <span>
              {user?.email
                ? `Signed in as ${user.email}`
                : isGuest
                  ? "Guest mode"
                  : "Not signed in"}
            </span>
            {user && (
              <button
                onClick={signOut}
                className="text-white/70 hover:text-white"
              >
                Sign Out
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCopyModal(true)}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm mb-3"
          >
            📋 Copy Log
          </button>
          <div className="mt-3">
            <button
              onClick={handleClearAll}
              className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors text-sm text-red-200"
            >
              Clear All Local Data
            </button>
          </div>

          <AnimatePresence>
            {syncStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-3 text-xs text-white/60"
              >
                {syncStatus}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Copy Log Modal */}
      <AnimatePresence>
        {showCopyModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCopyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCopyModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/20 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="text-center mb-6">
                  <div className="text-2xl mb-2">📋</div>
                  <h3 className="text-xl font-bold mb-2">Copy Log</h3>
                  <p className="text-white/60 text-sm">
                    Select one or more dates and choose what to include
                  </p>
                </div>
                
                {/* Custom Calendar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        const prevMonth = new Date(currentMonth);
                        prevMonth.setMonth(prevMonth.getMonth() - 1);
                        setCurrentMonth(prevMonth);
                      }}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      ‹
                    </button>
                    <h4 className="text-sm font-semibold">
                      {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </h4>
                    <button
                      onClick={() => {
                        const nextMonth = new Date(currentMonth);
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        const today = new Date();
                        if (nextMonth <= today) {
                          setCurrentMonth(nextMonth);
                        }
                      }}
                      disabled={
                        currentMonth.getMonth() === new Date().getMonth() &&
                        currentMonth.getFullYear() === new Date().getFullYear()
                      }
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ›
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                      <div key={`day-header-${idx}`} className="text-center text-xs text-white/40 font-medium py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, idx) => {
                      if (!day) {
                        return <div key={idx} className="aspect-square" />;
                      }
                      
                      const dateKey = day.toISOString().split("T")[0];
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = day <= today;
                      const isSelected = selectedDates.has(dateKey);
                      const hasData = entries.some((e) => e.date === dateKey);
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => isPast && toggleDateSelection(dateKey)}
                          disabled={!isPast}
                          className={`aspect-square rounded-lg text-xs font-medium transition-all ${
                            !isPast
                              ? "opacity-20 cursor-not-allowed"
                              : isSelected
                                ? "bg-white text-[#0a0a0a] font-semibold"
                                : hasData
                                  ? "bg-white/10 border border-white/20 hover:bg-white/20"
                                  : "bg-white/5 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedDates.size > 0 && (
                    <div className="mt-3 text-xs text-white/60 text-center">
                      {selectedDates.size} day{selectedDates.size !== 1 ? "s" : ""} selected
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm">Date Header</span>
                    <input
                      type="checkbox"
                      checked={copyOptions.includeDate}
                      onChange={(e) => setCopyOptions({ ...copyOptions, includeDate: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm">Nutrition Section</span>
                    <input
                      type="checkbox"
                      checked={copyOptions.includeNutrition}
                      onChange={(e) => setCopyOptions({ ...copyOptions, includeNutrition: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                  
                  {copyOptions.includeNutrition && (
                    <div className="ml-4 space-y-2">
                      <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-xs text-white/70">Calories</span>
                        <input
                          type="checkbox"
                          checked={copyOptions.includeCalories}
                          onChange={(e) => setCopyOptions({ ...copyOptions, includeCalories: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-xs text-white/70">Fat</span>
                        <input
                          type="checkbox"
                          checked={copyOptions.includeFat}
                          onChange={(e) => setCopyOptions({ ...copyOptions, includeFat: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-xs text-white/70">Carbs</span>
                        <input
                          type="checkbox"
                          checked={copyOptions.includeCarbs}
                          onChange={(e) => setCopyOptions({ ...copyOptions, includeCarbs: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                      </label>
                      <label className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                        <span className="text-xs text-white/70">Protein</span>
                        <input
                          type="checkbox"
                          checked={copyOptions.includeProtein}
                          onChange={(e) => setCopyOptions({ ...copyOptions, includeProtein: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                      </label>
                    </div>
                  )}
                  
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm">Fitness/Activity</span>
                    <input
                      type="checkbox"
                      checked={copyOptions.includeFitness}
                      onChange={(e) => setCopyOptions({ ...copyOptions, includeFitness: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm">Workouts</span>
                    <input
                      type="checkbox"
                      checked={copyOptions.includeWorkouts}
                      onChange={(e) => setCopyOptions({ ...copyOptions, includeWorkouts: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-sm">Summary</span>
                    <input
                      type="checkbox"
                      checked={copyOptions.includeSummary}
                      onChange={(e) => setCopyOptions({ ...copyOptions, includeSummary: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                  </label>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCopyModal(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={copyDailyLog}
                    disabled={selectedDates.size === 0}
                    className="flex-1 py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Copy {selectedDates.size > 0 && `(${selectedDates.size})`}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Insights;
