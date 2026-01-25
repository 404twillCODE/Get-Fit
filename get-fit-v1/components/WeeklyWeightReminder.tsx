"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import WeightTracker from "./WeightTracker";
import { loadAppData } from "@/lib/dataStore";
import { formatDateKey } from "@/lib/storage";

const LAST_WEIGHT_REMINDER_KEY = "lastWeightReminder";
const ACCOUNT_CREATION_KEY = "accountCreationDate";

const WeeklyWeightReminder = () => {
  const { user, isGuest } = useAuth();
  const [showReminder, setShowReminder] = useState(false);
  const [showWeightTracker, setShowWeightTracker] = useState(false);

  useEffect(() => {
    checkWeeklyReminder();
  }, [user, isGuest]);

  const checkWeeklyReminder = async () => {
    // Get account creation date or first weight entry date
    let startDate: Date | null = null;
    
    // Check if we have an account creation date stored
    const storedCreationDate = localStorage.getItem(ACCOUNT_CREATION_KEY);
    if (storedCreationDate) {
      startDate = new Date(storedCreationDate);
    } else {
      // If no stored date, check for first weight entry or use today as start
      const data = await loadAppData();
      if (data.weightHistory && data.weightHistory.length > 0) {
        // Use the oldest weight entry date
        const oldestEntry = data.weightHistory[data.weightHistory.length - 1];
        startDate = new Date(oldestEntry.date + "T00:00:00");
        // Store it for future reference
        localStorage.setItem(ACCOUNT_CREATION_KEY, startDate.toISOString());
      } else {
        // First time - set today as creation date and don't show reminder yet
        const today = new Date();
        localStorage.setItem(ACCOUNT_CREATION_KEY, today.toISOString());
        localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, today.toISOString());
        return;
      }
    }

    // Check last reminder date
    const lastReminderStr = localStorage.getItem(LAST_WEIGHT_REMINDER_KEY);
    const now = new Date();
    
    if (!lastReminderStr) {
      // No reminder shown yet - check if a week has passed since account creation
      const daysSinceCreation = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceCreation >= 7) {
        setShowReminder(true);
        localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, now.toISOString());
      }
    } else {
      // Check if a week has passed since last reminder
      const lastReminder = new Date(lastReminderStr);
      const daysSinceLastReminder = Math.floor((now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastReminder >= 7) {
        // Check if user has logged weight recently (within last 7 days)
        const data = await loadAppData();
        const recentWeightEntry = data.weightHistory?.find(entry => {
          const entryDate = new Date(entry.date + "T00:00:00");
          const daysAgo = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          return daysAgo <= 7;
        });

        // Only show reminder if they haven't logged weight recently
        if (!recentWeightEntry) {
          setShowReminder(true);
          localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, now.toISOString());
        } else {
          // They logged weight, update reminder date to now
          localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, now.toISOString());
        }
      }
    }
  };

  const handleLogWeight = () => {
    setShowReminder(false);
    setShowWeightTracker(true);
  };

  const handleRemindLater = () => {
    setShowReminder(false);
    // Set reminder to show again in 3 days instead of 7
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, threeDaysFromNow.toISOString());
  };

  const handleWeightTrackerClose = () => {
    setShowWeightTracker(false);
    // Update reminder date after logging weight
    localStorage.setItem(LAST_WEIGHT_REMINDER_KEY, new Date().toISOString());
  };

  return (
    <>
      <AnimatePresence>
        {showReminder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/20 max-w-md w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">⚖️</div>
                <h3 className="text-xl font-bold mb-2">Time to Weigh In!</h3>
                <p className="text-white/70 text-sm">
                  Hey! It's time for your weekly weigh-in. Check your weight and log it to track your progress.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogWeight}
                  className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  Log My Weight
                </button>
                <button
                  onClick={handleRemindLater}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors text-sm"
                >
                  Remind Me Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showWeightTracker && (
        <WeightTracker onClose={handleWeightTrackerClose} />
      )}
    </>
  );
};

export default WeeklyWeightReminder;
