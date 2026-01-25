"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  formatDateKey,
  type DeficitEntry,
  type WorkoutHistoryEntry,
} from "@/lib/storage";
import { loadAppData } from "@/lib/dataStore";
import { type WeightEntry } from "@/lib/storage";

const Insights = () => {
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<unknown[][]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);

  const loadData = async () => {
    const data = await loadAppData();
    setEntries(data.deficitEntries);
    setHistory(data.workoutHistory);
    setSchedule(data.workoutSchedule);
    setSavedWorkouts(data.savedWorkouts);
    setWeightHistory(data.weightHistory || []);
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
        const cursorKey = formatDateKey(cursor);
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

  const lastWorkoutDate = stats.lastWorkout
    ? new Date(stats.lastWorkout.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "No workouts yet";

  return (
    <div className="max-w-md lg:max-w-7xl mx-auto min-h-screen bg-[#0a0a0a]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Insights</h1>
        <p className="text-white/60 text-sm lg:text-base">
          Your progress overview and recent trends.
        </p>
      </motion.header>

      {/* Desktop: Stats and Time Periods Side by Side */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10 mb-6 lg:mb-0"
        >
          <div className="text-white/60 text-sm lg:text-base mb-4">Daily Momentum</div>
          <div className="grid grid-cols-3 gap-3 lg:gap-4 text-center">
            <div className="rounded-xl bg-white/5 py-3 lg:py-4 px-2 lg:px-3 border border-white/10">
              <div className="text-xs lg:text-sm text-white/50 mb-1">Streak</div>
              <div className="text-lg lg:text-xl font-semibold">{stats.streak} days</div>
            </div>
            <div className="rounded-xl bg-white/5 py-3 lg:py-4 px-2 lg:px-3 border border-white/10">
              <div className="text-xs lg:text-sm text-white/50 mb-1">7-Day Avg</div>
              <div
                className={`text-lg lg:text-xl font-semibold ${
                  stats.weeklyAverage < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stats.weeklyAverage >= 0 ? "+" : ""}
                {stats.weeklyAverage}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 py-3 lg:py-4 px-2 lg:px-3 border border-white/10">
              <div className="text-xs lg:text-sm text-white/50 mb-1">Days Logged</div>
              <div className="text-lg lg:text-xl font-semibold">{stats.totalLoggedDays}</div>
            </div>
          </div>
        </motion.div>

      <div className="mb-6 lg:mb-0 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-sm lg:text-base mb-4">Weight Trends</div>
          {weightHistory.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Latest Weight</span>
                <span className="text-white font-semibold">
                  {weightHistory[0].weight.toFixed(1)} lbs
                </span>
              </div>
              {weightHistory.length > 1 && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Change (last 2 entries)</span>
                  <span className={`font-semibold ${
                    weightHistory[0].weight - weightHistory[1].weight < 0 
                      ? "text-green-400" 
                      : weightHistory[0].weight - weightHistory[1].weight > 0 
                        ? "text-red-400" 
                        : "text-white"
                  }`}>
                    {weightHistory[0].weight - weightHistory[1].weight > 0 ? "+" : ""}
                    {(weightHistory[0].weight - weightHistory[1].weight).toFixed(1)} lbs
                  </span>
                </div>
              )}
              {weightHistory.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-white/50 text-sm">Total Entries</span>
                  <span className="text-white/60 text-sm">{weightHistory.length} logged</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/50 text-sm">
                No weight data logged yet. Add entries in your profile.
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-sm lg:text-base mb-4">Weight Loss Estimate</div>
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
                  stats.totalDeficit <= 0 ? "text-green-400" : "text-red-400"
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
      </div>

      {/* Desktop: Time Periods and Workout Trends Side by Side */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 lg:grid lg:grid-cols-2 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10 mb-6 lg:mb-0"
        >
          <div className="text-white/60 text-sm lg:text-base mb-4">Workout Trends</div>
          <div className="space-y-3 text-sm lg:text-base text-white/80">
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

    </div>
  );
};

export default Insights;
