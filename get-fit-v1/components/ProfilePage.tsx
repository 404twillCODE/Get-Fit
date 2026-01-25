"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import ProfileSetup, { type UserProfile } from "@/components/ProfileSetup";
import AccountSettings from "@/components/AccountSettings";
import WeightTracker from "@/components/WeightTracker";
import { loadAppData, updateAppData } from "@/lib/dataStore";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
  formatDateKey,
  type DeficitEntry,
  type WorkoutHistoryEntry,
} from "@/lib/storage";

const formatHeight = (heightInInches?: number) => {
  if (!heightInInches || heightInInches <= 0) return "—";
  const feet = Math.floor(heightInInches / 12);
  const inches = Math.round(heightInInches % 12);
  return `${feet}' ${inches}"`;
};

const ProfilePage = () => {
  const { user, isGuest, signOut, logoutGuest } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showWeightTracker, setShowWeightTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<unknown[][]>([]);
  const [syncStatus, setSyncStatus] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(
    new Set([formatDateKey(new Date())])
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [lastClickedDate, setLastClickedDate] = useState<string | null>(null);
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    deleteDeficitEntries: false,
    deleteWorkouts: false,
    deleteWorkoutHistory: false,
    deleteWorkoutSchedule: false,
  });
  const [expandedDeleteSection, setExpandedDeleteSection] = useState<string | null>(null);
  const [selectedDatesToDelete, setSelectedDatesToDelete] = useState<Set<string>>(new Set());
  const [selectedWorkoutDaysToDelete, setSelectedWorkoutDaysToDelete] = useState<Set<number>>(new Set());
  const [selectedWorkoutHistoryToDelete, setSelectedWorkoutHistoryToDelete] = useState<Set<number>>(new Set());

  const loadProfile = async () => {
    setIsLoading(true);
    if (user) {
      try {
        const appData = await loadAppData();
        if (appData.profile) {
          setProfile(appData.profile);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Error loading profile from dataStore:", err);
      }

      const supabase = getSupabaseClient();
      const userProfile = user.user_metadata?.profile as UserProfile | undefined;
      if (supabase && userProfile) {
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    } else if (isGuest) {
      const guestProfile = localStorage.getItem("guestProfile");
      if (guestProfile) {
        try {
          setProfile(JSON.parse(guestProfile));
        } catch (err) {
          console.error("Error parsing guest profile:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
    setIsLoading(false);
  };

  const loadData = async () => {
    const data = await loadAppData();
    setEntries(data.deficitEntries);
    setHistory(data.workoutHistory);
    setSchedule(data.workoutSchedule);
    setSavedWorkouts(data.savedWorkouts);
  };

  useEffect(() => {
    loadProfile();
    loadData();
  }, [user, isGuest]);

<<<<<<< Updated upstream:get-fit-v1/components/ProfilePage.tsx
=======
  const loadUserProfile = async () => {
    if (user) {
      // Load from Supabase user metadata for authenticated users
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const profile = user.user_metadata?.profile as UserProfile | undefined;
      if (profile) {
        setUserProfile(profile);
      }
    } else if (isGuest) {
      // Load from localStorage for guest users
      const guestProfile = localStorage.getItem("guestProfile");
      if (guestProfile) {
        try {
          setUserProfile(JSON.parse(guestProfile));
        } catch (err) {
          console.error("Error parsing guest profile:", err);
        }
      }
    }
  };

  // When modal opens, ensure today's date is selected and set as last clicked
>>>>>>> Stashed changes:components/Insights.tsx
  useEffect(() => {
    if (showCopyModal) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = formatDateKey(today);
      setSelectedDates(new Set([todayKey]));
      setLastClickedDate(todayKey);
      setCurrentMonth(new Date());
    }
  }, [showCopyModal]);

  const profileRows = useMemo(
    () => [
      { label: "Name", value: profile?.name || "—" },
      { label: "Age", value: profile?.age ? profile.age.toString() : "—" },
      { label: "Height", value: formatHeight(profile?.height) },
      { label: "Current Weight", value: profile?.currentWeight ? `${profile.currentWeight} lbs` : "—" },
      { label: "Goal Weight", value: profile?.goalWeight ? `${profile.goalWeight} lbs` : "—" },
      { label: "Activity Level", value: profile?.activityLevel || "—" },
      { label: "Fitness Goal", value: profile?.fitnessGoal || "—" },
    ],
    [profile]
  );

  const handleDeleteData = async () => {
    const data = await loadAppData();
    const updatedData = { ...data };

    if (selectedDatesToDelete.size > 0) {
      updatedData.deficitEntries = updatedData.deficitEntries.filter(
        (entry) => !selectedDatesToDelete.has(entry.date)
      );
    } else if (deleteOptions.deleteDeficitEntries) {
      updatedData.deficitEntries = [];
    }

    if (selectedWorkoutDaysToDelete.size > 0) {
      const newWorkouts = [...updatedData.savedWorkouts];
      selectedWorkoutDaysToDelete.forEach((dayIndex) => {
        newWorkouts[dayIndex] = [];
      });
      updatedData.savedWorkouts = newWorkouts;
    } else if (deleteOptions.deleteWorkouts) {
      updatedData.savedWorkouts = Array.from({ length: 7 }, () => []);
    }

    if (selectedWorkoutHistoryToDelete.size > 0) {
      updatedData.workoutHistory = updatedData.workoutHistory.filter(
        (_, index) => !selectedWorkoutHistoryToDelete.has(index)
      );
    } else if (deleteOptions.deleteWorkoutHistory) {
      updatedData.workoutHistory = [];
    }

    if (deleteOptions.deleteWorkoutSchedule) {
      updatedData.workoutSchedule = Array(7).fill("Rest Day");
    }

    await updateAppData(() => updatedData);
    await loadData();
    setShowDeleteModal(false);
    setDeleteOptions({
      deleteDeficitEntries: false,
      deleteWorkouts: false,
      deleteWorkoutHistory: false,
      deleteWorkoutSchedule: false,
    });
    setExpandedDeleteSection(null);
    setSelectedDatesToDelete(new Set());
    setSelectedWorkoutDaysToDelete(new Set());
    setSelectedWorkoutHistoryToDelete(new Set());
    setSyncStatus("Data deleted successfully!");
    setTimeout(() => setSyncStatus(""), 3000);
  };

  const toggleDateSelection = (dateKey: string) => {
    if (lastClickedDate && lastClickedDate !== dateKey) {
      const startDate = new Date(lastClickedDate + "T00:00:00");
      const endDate = new Date(dateKey + "T00:00:00");
      
      let earlierDate: Date;
      let laterDate: Date;
      if (startDate <= endDate) {
        earlierDate = startDate;
        laterDate = endDate;
      } else {
        earlierDate = endDate;
        laterDate = startDate;
      }
      
      const newSelected = new Set<string>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const currentDate = new Date(earlierDate);
      while (currentDate <= laterDate) {
        const dateKeyToAdd = formatDateKey(currentDate);
        const dateToCheck = new Date(currentDate);
        dateToCheck.setHours(0, 0, 0, 0);
        
        if (dateToCheck <= today) {
          newSelected.add(dateKeyToAdd);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setSelectedDates(newSelected);
      setLastClickedDate(dateKey);
    } else {
      const newSelected = new Set(selectedDates);
      if (newSelected.has(dateKey)) {
        newSelected.delete(dateKey);
        setLastClickedDate(null);
      } else {
        newSelected.add(dateKey);
        setLastClickedDate(dateKey);
      }
      setSelectedDates(newSelected);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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
            logText += `${exercise.name}\n`;
            if (exercise.sets) {
              exercise.sets.forEach((set: any) => {
                if (set.completed) {
                  logText += `  Set ${set.setNumber}: ${set.reps} reps × ${
                    set.weight > 0 ? `${set.weight} lbs` : "bodyweight"
                  }\n`;
                }
              });
            }
          });
          logText += `\n`;
        }
      }

      if (copyOptions.includeSummary && selectedEntry) {
        logText += `📈 SUMMARY\n`;
        logText += `Calories Eaten: ${selectedEntry.caloriesEaten}\n`;
        logText += `Calories Burned: ${selectedEntry.caloriesBurned}\n`;
        logText += `Deficit: ${selectedEntry.deficit}\n\n`;
      }
    });

    try {
      await navigator.clipboard.writeText(logText.trim());
      setSyncStatus("Log copied to clipboard!");
      setShowCopyModal(false);
    } catch (error) {
      console.error("Failed to copy log:", error);
      setSyncStatus("Failed to copy log. Please try again.");
    }

    setTimeout(() => setSyncStatus(""), 3000);
  };

  return (
    <div className="max-w-md lg:max-w-4xl xl:max-w-5xl mx-auto min-h-screen bg-[#0a0a0a]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-center">Profile</h1>
        <p className="text-white/60 text-sm text-center">
          Manage your profile and account settings.
        </p>
      </motion.header>

      <div className="px-4 sm:px-6 lg:px-8 pb-24 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-white/60 text-xs mb-1">Profile Info</div>
              <div className="text-lg font-semibold">
                {profile?.name || (isGuest ? "Guest" : user?.email || "Your Profile")}
              </div>
            </div>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs hover:bg-white/20 transition-colors"
            >
              Edit
            </button>
          </div>

          {isLoading ? (
            <div className="text-white/40 text-sm">Loading profile...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2"
                >
                  <div className="text-[11px] text-white/60 mb-1">{row.label}</div>
                  <div className="text-sm text-white truncate">{row.value}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-xs mb-3">Actions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setShowProfileEdit(true)}
              className="py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => setShowWeightTracker(true)}
              className="py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
            >
              Track Weight
            </button>
            {user && (
              <button
                onClick={() => setShowAccountSettings(true)}
                className="py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors"
              >
                Account Settings
              </button>
            )}
            {user ? (
              <button
                onClick={signOut}
                className="py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={logoutGuest}
                className="py-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-colors"
              >
                Exit Guest
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-xs mb-3">Data Tools</div>
          <div className="flex items-center justify-between text-xs text-white/50 mb-4">
            <span>
              {user?.email
                ? `Signed in as ${user.email}`
                : isGuest
                  ? "Guest mode"
                  : "Not signed in"}
            </span>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              const todayKey = formatDateKey(today);
              setSelectedDates(new Set([todayKey]));
              setLastClickedDate(todayKey);
              setCurrentMonth(today);
              setShowCopyModal(true);
            }}
            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm mb-3"
          >
            📋 Copy Log
          </button>
          <div className="mt-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors text-sm text-red-200"
            >
              🗑️ Delete Data
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

      {showProfileEdit && (
        <ProfileSetup
          initialProfile={profile}
          onComplete={() => {
            setShowProfileEdit(false);
            loadProfile();
          }}
        />
      )}

      {showAccountSettings && (
        <AccountSettings onClose={() => setShowAccountSettings(false)} />
      )}

      {showWeightTracker && (
        <WeightTracker
          onClose={() => {
            setShowWeightTracker(false);
          }}
        />
      )}

      {/* Copy Log Modal */}
      <AnimatePresence>
        {showCopyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCopyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowCopyModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 border border-white/20 max-w-md sm:max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto -mt-8"
              >
                <div className="text-center mb-6">
                  <div className="text-2xl mb-2">📋</div>
                  <h3 className="text-xl font-bold mb-2">Copy Log</h3>
                  <p className="text-white/60 text-sm">
                    Select one or more dates and choose what to include
                  </p>
                </div>
                
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
                      
                      const dayNormalized = new Date(day);
                      dayNormalized.setHours(0, 0, 0, 0);
                      const dateKey = formatDateKey(dayNormalized);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isPast = dayNormalized <= today;
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

      {/* Delete Data Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 border border-white/20 max-w-md sm:max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto -mt-8"
              >
                <div className="text-center mb-6">
                  <div className="text-2xl mb-2">🗑️</div>
                  <h3 className="text-xl font-bold mb-2">Delete Data</h3>
                  <p className="text-white/60 text-sm">
                    Select what data you want to delete
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {entries.length > 0 && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedDeleteSection(expandedDeleteSection === "deficit" ? null : "deficit")}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="text-left">
                          <span className="text-sm font-medium">Deficit Entries</span>
                          <div className="text-xs text-white/50 mt-1">
                            {selectedDatesToDelete.size > 0 
                              ? `${selectedDatesToDelete.size} selected` 
                              : `${entries.length} day${entries.length !== 1 ? "s" : ""} of nutrition & fitness data`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedDatesToDelete.size > 0 && (
                            <span className="text-xs text-red-400">{selectedDatesToDelete.size}</span>
                          )}
                          <span className="text-white/40">{expandedDeleteSection === "deficit" ? "▼" : "▶"}</span>
                        </div>
                      </button>
                      {expandedDeleteSection === "deficit" && (
                        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                if (selectedDatesToDelete.size === entries.length) {
                                  setSelectedDatesToDelete(new Set());
                                } else {
                                  setSelectedDatesToDelete(new Set(entries.map((e) => e.date)));
                                }
                              }}
                              className="text-xs text-white/60 hover:text-white/80"
                            >
                              {selectedDatesToDelete.size === entries.length ? "Deselect All" : "Select All"}
                            </button>
                          </div>
                          {entries
                            .sort((a, b) => b.date.localeCompare(a.date))
                            .map((entry) => {
                              const entryDate = new Date(entry.date);
                              const isSelected = selectedDatesToDelete.has(entry.date);
                              return (
                                <label
                                  key={entry.date}
                                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                  <div>
                                    <span className="text-xs font-medium">
                                      {entryDate.toLocaleDateString("en-US", {
                                        weekday: "short",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <div className="text-xs text-white/50 mt-0.5">
                                      {entry.caloriesEaten || 0} eaten • {entry.caloriesBurned || 0} burned
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedDatesToDelete);
                                      if (e.target.checked) {
                                        newSelected.add(entry.date);
                                      } else {
                                        newSelected.delete(entry.date);
                                      }
                                      setSelectedDatesToDelete(newSelected);
                                    }}
                                    className="w-4 h-4 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {history.length > 0 && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedDeleteSection(expandedDeleteSection === "history" ? null : "history")}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="text-left">
                          <span className="text-sm font-medium">Workout History</span>
                          <div className="text-xs text-white/50 mt-1">
                            {selectedWorkoutHistoryToDelete.size > 0
                              ? `${selectedWorkoutHistoryToDelete.size} selected`
                              : `${history.length} completed workout${history.length !== 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <span className="text-white/40">{expandedDeleteSection === "history" ? "▼" : "▶"}</span>
                      </button>
                      {expandedDeleteSection === "history" && (
                        <div className="px-3 pb-3 space-y-2 max-h-48 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <button
                              onClick={() => {
                                if (selectedWorkoutHistoryToDelete.size === history.length) {
                                  setSelectedWorkoutHistoryToDelete(new Set());
                                } else {
                                  setSelectedWorkoutHistoryToDelete(new Set(history.map((_, i) => i)));
                                }
                              }}
                              className="text-xs text-white/60 hover:text-white/80"
                            >
                              {selectedWorkoutHistoryToDelete.size === history.length ? "Deselect All" : "Select All"}
                            </button>
                          </div>
                          {history
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .map((workout) => {
                              const workoutDate = new Date(workout.date);
                              const originalIndex = history.findIndex((w) => w.timestamp === workout.timestamp);
                              const isSelected = selectedWorkoutHistoryToDelete.has(originalIndex);
                              return (
                                <label
                                  key={workout.timestamp}
                                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                >
                                  <span className="text-xs">
                                    {workoutDate.toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newSelected = new Set(selectedWorkoutHistoryToDelete);
                                      if (e.target.checked) {
                                        newSelected.add(originalIndex);
                                      } else {
                                        newSelected.delete(originalIndex);
                                      }
                                      setSelectedWorkoutHistoryToDelete(newSelected);
                                    }}
                                    className="w-4 h-4 rounded"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </label>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {schedule.some((day) => day !== "Rest Day") && (
                    <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                      <div>
                        <span className="text-sm font-medium">Workout Schedule</span>
                        <div className="text-xs text-white/50 mt-1">
                          Weekly workout plan
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={deleteOptions.deleteWorkoutSchedule}
                        onChange={(e) => setDeleteOptions({ ...deleteOptions, deleteWorkoutSchedule: e.target.checked })}
                        className="w-5 h-5 rounded"
                      />
                    </label>
                  )}
                  
                  {savedWorkouts.some((day: unknown[]) => Array.isArray(day) && day.length > 0) && (
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <button
                        onClick={() => setExpandedDeleteSection(expandedDeleteSection === "workouts" ? null : "workouts")}
                        className="w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors"
                      >
                        <div className="text-left">
                          <span className="text-sm font-medium">Saved Workouts</span>
                          <div className="text-xs text-white/50 mt-1">
                            {selectedWorkoutDaysToDelete.size > 0
                              ? `${selectedWorkoutDaysToDelete.size} day${selectedWorkoutDaysToDelete.size !== 1 ? "s" : ""} selected`
                              : "Planned workouts by day"}
                          </div>
                        </div>
                        <span className="text-white/40">{expandedDeleteSection === "workouts" ? "▼" : "▶"}</span>
                      </button>
                      {expandedDeleteSection === "workouts" && (
                        <div className="px-3 pb-3 space-y-2">
                          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((dayName, dayIndex) => {
                            const hasWorkouts = Array.isArray(savedWorkouts[dayIndex]) && savedWorkouts[dayIndex].length > 0;
                            if (!hasWorkouts) return null;
                            const isSelected = selectedWorkoutDaysToDelete.has(dayIndex);
                            return (
                              <label
                                key={dayIndex}
                                className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                              >
                                <span className="text-xs">
                                  {dayName} ({savedWorkouts[dayIndex].length} exercise{(savedWorkouts[dayIndex] as unknown[]).length !== 1 ? "s" : ""})
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newSelected = new Set(selectedWorkoutDaysToDelete);
                                    if (e.target.checked) {
                                      newSelected.add(dayIndex);
                                    } else {
                                      newSelected.delete(dayIndex);
                                    }
                                    setSelectedWorkoutDaysToDelete(newSelected);
                                  }}
                                  className="w-4 h-4 rounded"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {entries.length === 0 && history.length === 0 && 
                   !schedule.some((day) => day !== "Rest Day") &&
                   !savedWorkouts.some((day: unknown[]) => Array.isArray(day) && day.length > 0) && (
                    <div className="text-center py-4 text-white/40 text-sm">
                      No data to delete
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteOptions({
                        deleteDeficitEntries: false,
                        deleteWorkouts: false,
                        deleteWorkoutHistory: false,
                        deleteWorkoutSchedule: false,
                      });
                    }}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteData}
                    disabled={
                      selectedDatesToDelete.size === 0 &&
                      selectedWorkoutDaysToDelete.size === 0 &&
                      selectedWorkoutHistoryToDelete.size === 0 &&
                      !deleteOptions.deleteWorkoutSchedule
                    }
                    className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl font-semibold hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Delete Selected
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

export default ProfilePage;
