"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadAppData } from "@/lib/dataStore";
import { formatDateKey } from "@/lib/storage";

const Dashboard = () => {
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

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      const data = await loadAppData();
      if (!isMounted) return;

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
    };

    loadDashboardData();
    
    // Refresh when page becomes visible (user navigates back from other pages)
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted) {
        loadDashboardData();
      }
    };
    
    // Also refresh on focus (when user switches back to tab)
    const handleFocus = () => {
      if (isMounted) {
        loadDashboardData();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const deficit = todayCalories.eaten - todayCalories.burned;

  return (
    <div className="max-w-md lg:max-w-7xl mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
          Get Fit
        </h1>
        <p className="text-white/60 text-xs sm:text-sm lg:text-base">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </motion.header>

      {/* Desktop Layout: Stats and Insights Side by Side */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/10 mb-4 lg:mb-0"
        >
          <div className="text-white/60 text-xs sm:text-sm lg:text-base mb-2">Today&apos;s Deficit</div>
          <div
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${
              deficit <= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {deficit >= 0 ? "+" : ""}
            {Math.round(deficit).toLocaleString()}
          </div>
          <div className="text-white/40 text-xs sm:text-sm mt-2">
            {todayCalories.burned} burned - {todayCalories.eaten} eaten
          </div>
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white/5 rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-xs sm:text-sm lg:text-base mb-3 sm:mb-4">Insights</div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-center">
            <div className="rounded-xl bg-white/5 py-2 sm:py-3 lg:py-4 px-1 sm:px-2 lg:px-3 border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 mb-1">Streak</div>
              <div className="text-base sm:text-lg lg:text-xl font-semibold">{insights.streak} days</div>
            </div>
            <div className="rounded-xl bg-white/5 py-2 sm:py-3 lg:py-4 px-1 sm:px-2 lg:px-3 border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 mb-1">7-Day Avg</div>
              <div
                className={`text-base sm:text-lg lg:text-xl font-semibold ${
                  insights.weeklyAverage <= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {insights.weeklyAverage >= 0 ? "+" : ""}
                {insights.weeklyAverage}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 py-2 sm:py-3 lg:py-4 px-1 sm:px-2 lg:px-3 border border-white/10">
              <div className="text-xs sm:text-sm text-white/50 mb-1">Days Logged</div>
              <div className="text-base sm:text-lg lg:text-xl font-semibold">{insights.totalLoggedDays}</div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Quick Actions */}
      <div className="px-4 sm:px-6 lg:px-8 space-y-3 sm:space-y-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/workouts" className="block active:scale-[0.98] transition-transform touch-manipulation cursor-pointer">
            <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/10 active:bg-white/15 active:border-white/20 transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] pointer-events-auto">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs sm:text-sm mb-1">Workout Routine</div>
                  <div className="text-lg sm:text-xl font-semibold truncate">
                    {todayWorkouts > 0
                      ? `${todayWorkouts} Exercise${todayWorkouts !== 1 ? "s" : ""}`
                      : "Start Workout"}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl ml-3 flex-shrink-0">💪</div>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/calories" className="block active:scale-[0.98] transition-transform touch-manipulation cursor-pointer">
            <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/10 active:bg-white/15 active:border-white/20 transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] pointer-events-auto">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs sm:text-sm mb-1">Deficit Calculator</div>
                  <div className="text-lg sm:text-xl font-semibold truncate">
                    {todayCalories.eaten > 0 || todayCalories.burned > 0
                      ? "Update Today"
                      : "Log Data"}
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl ml-3 flex-shrink-0">🔥</div>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/insights" className="block active:scale-[0.98] transition-transform touch-manipulation cursor-pointer">
            <div className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 hover:bg-white/10 active:bg-white/15 active:border-white/20 transition-all touch-manipulation min-h-[80px] sm:min-h-[auto] pointer-events-auto">
              <div className="flex items-center justify-between pointer-events-none">
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs sm:text-sm mb-1">Insights</div>
                  <div className="text-lg sm:text-xl font-semibold truncate">
                    View Stats
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl ml-3 flex-shrink-0">📈</div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Weekly Progress */}
      <div className="px-4 sm:px-6 mb-6 pb-20 sm:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10"
        >
          <div className="text-white/60 text-xs sm:text-sm mb-3 sm:mb-4">This Week</div>
          <div className="flex justify-between items-end gap-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
              const dayIndex = index;
              const hasWorkout = weeklyWorkouts[dayIndex] || false;
              const isToday = dayIndex === new Date().getDay();

              return (
                <div key={`weekday-${index}`} className="flex-1 flex flex-col items-center">
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

