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
  pullFromSupabase,
  pushToSupabase,
  resetToDefaults,
  saveAppData,
} from "@/lib/dataStore";

const Insights = () => {
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [importError, setImportError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isGuest, signOut } = useAuth();

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
    };
  }, [entries, history, schedule]);

  const handleExport = async () => {
    const data = await loadAppData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateKey = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `get-fit-backup-${dateKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setImportError("");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AppData>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Invalid backup format.");
      }

      const merged: AppData = {
        ...getDefaultData(),
        ...parsed,
      };
      await saveAppData(merged);
      await loadData();
    } catch (error: any) {
      setImportError(error?.message || "Failed to import backup.");
    }
  };

  const handleClearAll = async () => {
    const confirmation = prompt(
      "Type CLEAR to delete all local Get Fit data."
    );
    if (confirmation !== "CLEAR") return;
    await resetToDefaults();
    await loadData();
  };

  const handlePull = async () => {
    setSyncStatus("");
    if (!user) {
      setSyncStatus("Sign in to sync with Supabase.");
      return;
    }
    const remote = await pullFromSupabase();
    if (remote) {
      await loadData();
      setSyncStatus("Pulled latest data from Supabase.");
    } else {
      setSyncStatus("No remote data found yet.");
    }
  };

  const handlePush = async () => {
    setSyncStatus("");
    if (!user) {
      setSyncStatus("Sign in to sync with Supabase.");
      return;
    }
    const success = await pushToSupabase();
    setSyncStatus(
      success ? "Synced local data to Supabase." : "Sync failed."
    );
  };

  const lastWorkoutDate = stats.lastWorkout
    ? new Date(stats.lastWorkout.timestamp).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "No workouts yet";

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#0a0a0a]">
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
                  stats.weeklyAverage >= 0 ? "text-green-400" : "text-red-400"
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
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExport}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ⬇️ Export Backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ⬆️ Import Backup
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handlePull}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ⬇️ Pull from Cloud
            </button>
            <button
              onClick={handlePush}
              className="py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              ⬆️ Push to Cloud
            </button>
          </div>
          <div className="mt-3">
            <button
              onClick={handleClearAll}
              className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors text-sm text-red-200"
            >
              Clear All Local Data
            </button>
          </div>

          <AnimatePresence>
            {(importError || syncStatus) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`mt-3 text-xs ${
                  importError ? "text-red-300" : "text-white/60"
                }`}
              >
                {importError || syncStatus}
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                handleImport(file);
                event.target.value = "";
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Insights;
