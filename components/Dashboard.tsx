"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAppData } from "@/lib/dataStore";
import { formatDateKey } from "@/lib/storage";
import WeeklyWeightReminder from "./WeeklyWeightReminder";
import { useAuth } from "@/components/AuthProvider";

const Dashboard = () => {
  const { user, isGuest } = useAuth();
  const [todayCalories, setTodayCalories] = useState({ eaten: 0, burned: 0 });
  const [todayWorkouts, setTodayWorkouts] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<boolean[]>(
    Array(7).fill(false)
  );
  const [insights, setInsights] = useState({
    totalLoggedDays: 0,
    weeklyAverage: 0,
    streak: 0,
  });
  const [displayName, setDisplayName] = useState("there");

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const data = await loadAppData();
        if (!isMounted) return;

        let name = user?.user_metadata?.profile?.name || data.profile?.name;
        if (!name && isGuest) {
          const guestProfile = localStorage.getItem("guestProfile");
          if (guestProfile) {
            try {
              const parsed = JSON.parse(guestProfile);
              name = parsed?.name;
            } catch (err) {
              console.warn("Error parsing guest profile:", err);
            }
          }
        }
        setDisplayName(name || "there");

        // Normalize today's date to ensure consistent date key format (using local time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = formatDateKey(today);
        
        const todayEntry = data.deficitEntries.find(
          (entry) => entry.date === todayKey
        );

        if (todayEntry) {
          setTodayCalories({
            eaten: todayEntry.caloriesEaten || 0,
            burned: todayEntry.caloriesBurned || 0,
          });
        } else {
          // Reset if no entry found
          setTodayCalories({ eaten: 0, burned: 0 });
        }

        const todayIndex = new Date().getDay();
        const todayWorkout = data.savedWorkouts[todayIndex] || [];
        setTodayWorkouts(todayWorkout.length);

        const weekly = data.savedWorkouts.map(
          (workout) => (workout?.length || 0) > 0
        );
        setWeeklyWorkouts(weekly);

        const sorted = [...data.deficitEntries].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        const totalLoggedDays = sorted.length;

        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 6);
        last7Days.setHours(0, 0, 0, 0);

        const weekEntries = sorted.filter((entry) => {
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

        const entryDates = new Set(sorted.map((entry) => entry.date));
        let streak = 0;
        const cursor = new Date();
        cursor.setHours(0, 0, 0, 0);

        while (true) {
          const cursorKey = formatDateKey(cursor);
          if (!entryDates.has(cursorKey)) break;
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        }

        setInsights({ totalLoggedDays, weeklyAverage, streak });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        if (!isMounted) return;
        // Set defaults on error
        setTodayCalories({ eaten: 0, burned: 0 });
        setTodayWorkouts(0);
        setWeeklyWorkouts(Array(7).fill(false));
        setInsights({ totalLoggedDays: 0, weeklyAverage: 0, streak: 0 });
      }
    };

    loadDashboardData();
    
    // Debounce refresh handlers to prevent excessive reloads
    let visibilityTimeout: NodeJS.Timeout | null = null;
    let focusTimeout: NodeJS.Timeout | null = null;
    
    // Refresh when page becomes visible (user navigates back from other pages)
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        if (visibilityTimeout) clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          if (isMounted) loadDashboardData();
        }, 100); // Small delay to debounce
      }
    };
    
    // Also refresh on focus (when user switches back to tab)
    const handleFocus = () => {
      if (isMounted) {
        if (focusTimeout) clearTimeout(focusTimeout);
        focusTimeout = setTimeout(() => {
          if (isMounted) loadDashboardData();
        }, 100); // Small delay to debounce
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      isMounted = false;
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      if (focusTimeout) clearTimeout(focusTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [user, isGuest]);

  const deficit = todayCalories.eaten - todayCalories.burned;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-md lg:max-w-6xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-10 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                Welcome, {displayName}
              </h1>
              <div className="text-white/50 text-xs sm:text-sm lg:text-base mb-1">
                Get Fit
              </div>
              <p className="text-white/60 text-xs sm:text-sm lg:text-base">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
              <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
              Tracking today
            </div>
          </div>
        </motion.header>

        <div className="px-4 sm:px-6 lg:px-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/5 to-white/0 p-5 sm:p-6 lg:p-8"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-white/60 text-xs sm:text-sm mb-2">Today&apos;s Deficit</div>
                <div
                  className={`text-4xl sm:text-5xl font-semibold ${
                    deficit <= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {deficit >= 0 ? "+" : ""}
                  {Math.round(deficit).toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-white/40">Calories eaten</div>
                  <div className="text-lg font-semibold text-white">{todayCalories.eaten}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-white/40">Calories burned</div>
                  <div className="text-lg font-semibold text-white">{todayCalories.burned}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
            >
              <div className="text-white/60 text-xs sm:text-sm mb-3">Insights</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-white/5 border border-white/10 py-2">
                  <div className="text-[11px] text-white/50 mb-1">Streak</div>
                  <div className="text-base font-semibold">{insights.streak}</div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 py-2">
                  <div className="text-[11px] text-white/50 mb-1">7-Day Avg</div>
                  <div className={`text-base font-semibold ${insights.weeklyAverage <= 0 ? "text-green-400" : "text-red-400"}`}>
                    {insights.weeklyAverage >= 0 ? "+" : ""}
                    {insights.weeklyAverage}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 py-2">
                  <div className="text-[11px] text-white/50 mb-1">Logged</div>
                  <div className="text-base font-semibold">{insights.totalLoggedDays}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 lg:col-span-2"
            >
              <div className="text-white/60 text-xs sm:text-sm mb-3">Quick Actions</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link href="/workouts" className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Workout</div>
                      <div className="text-base font-semibold text-white">
                        {todayWorkouts > 0
                          ? `${todayWorkouts} Exercise${todayWorkouts !== 1 ? "s" : ""}`
                          : "Start Workout"}
                      </div>
                    </div>
                    <div className="text-2xl">💪</div>
                  </div>
                </Link>
                <Link href="/calories" className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Deficit</div>
                      <div className="text-base font-semibold text-white">
                        {todayCalories.eaten > 0 || todayCalories.burned > 0 ? "Update Today" : "Log Data"}
                      </div>
                    </div>
                    <div className="text-2xl">🔥</div>
                  </div>
                </Link>
                <Link href="/insights" className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">Insights</div>
                      <div className="text-base font-semibold text-white">View Stats</div>
                    </div>
                    <div className="text-2xl">📈</div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 mb-6 pb-20 sm:pb-6"
          >
            <div className="text-white/60 text-xs sm:text-sm mb-3">This Week</div>
            <div className="flex justify-between items-end gap-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                const dayIndex = index;
                const hasWorkout = weeklyWorkouts[dayIndex] || false;
                const isToday = dayIndex === new Date().getDay();
                return (
                  <div key={`weekday-${index}`} className="flex-1 flex flex-col items-center">
                    <div
                      className={`w-full rounded-full transition-all ${
                        hasWorkout
                          ? "bg-gradient-to-t from-blue-500/70 to-blue-500/40 h-8"
                          : "bg-white/5 h-2"
                      } ${isToday ? "ring-2 ring-white/30" : ""}`}
                    />
                    <div className={`text-xs mt-2 ${isToday ? "text-white" : "text-white/40"}`}>
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
      <WeeklyWeightReminder />
    </div>
  );
};

export default Dashboard;

