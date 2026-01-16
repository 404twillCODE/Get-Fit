"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDateKey, type WeightEntry } from "@/lib/storage";
import { loadAppData, updateAppData } from "@/lib/dataStore";

const WeightTracker = ({ onClose }: { onClose: () => void }) => {
  const [weight, setWeight] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHealthKitInfo, setShowHealthKitInfo] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);
    
    loadWeightHistory();
  }, []);

  useEffect(() => {
    // Check if there's already a weight entry for today
    const todayKey = formatDateKey(new Date());
    const todayEntry = weightHistory.find(entry => entry.date === todayKey);
    if (todayEntry) {
      setWeight(todayEntry.weight.toString());
    }
  }, [weightHistory]);

  const loadWeightHistory = async () => {
    const data = await loadAppData();
    setWeightHistory(data.weightHistory || []);
  };

  const handleSave = async () => {
    const weightValue = parseFloat(weight);
    if (!weightValue || weightValue <= 0) {
      return;
    }

    setIsSaving(true);
    const dateKey = formatDateKey(selectedDate);
    const timestamp = Date.now();

    const data = await loadAppData();
    const existingHistory = data.weightHistory || [];
    
    // Set account creation date if this is the first weight entry
    if (existingHistory.length === 0) {
      const accountCreationDate = new Date();
      localStorage.setItem("accountCreationDate", accountCreationDate.toISOString());
    }
    
    // Remove existing entry for this date if it exists
    const filteredHistory = existingHistory.filter(entry => entry.date !== dateKey);
    
    // Add new entry
    const newEntry: WeightEntry = {
      date: dateKey,
      weight: weightValue,
      timestamp,
    };
    
    const updatedHistory = [...filteredHistory, newEntry].sort((a, b) => 
      b.timestamp - a.timestamp
    );

    await updateAppData((current) => ({
      ...current,
      weightHistory: updatedHistory,
    }));

    setWeightHistory(updatedHistory);
    
    // Update reminder date when weight is logged
    localStorage.setItem("lastWeightReminder", new Date().toISOString());
    
    setShowSuccess(true);
    setIsSaving(false);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const handleDelete = async (date: string) => {
    await updateAppData((current) => {
      const updatedHistory = (current.weightHistory || []).filter(entry => entry.date !== date);
      return {
        ...current,
        weightHistory: updatedHistory,
      };
    });
    
    // Reload to get the updated history
    const data = await loadAppData();
    setWeightHistory(data.weightHistory || []);
  };

  const getLatestWeight = () => {
    if (weightHistory.length === 0) return null;
    return weightHistory[0].weight;
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const previous = weightHistory[1].weight;
    const change = latest - previous;
    return change;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] rounded-3xl p-5 lg:p-6 border border-white/20 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Weight Tracker</h3>
            <p className="text-white/60 text-xs">Track your weight over time</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Current Stats */}
        {weightHistory.length > 0 && (
          <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-white/60 text-xs mb-1">Latest Weight</div>
                <div className="text-white font-semibold">{getLatestWeight()?.toFixed(1)} lbs</div>
              </div>
              {getWeightChange() !== null && (
                <div>
                  <div className="text-white/60 text-xs mb-1">Change</div>
                  <div className={`font-semibold ${getWeightChange()! < 0 ? "text-green-400" : getWeightChange()! > 0 ? "text-red-400" : "text-white"}`}>
                    {getWeightChange()! > 0 ? "+" : ""}{getWeightChange()!.toFixed(1)} lbs
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="mb-4 space-y-3">
          <div>
            <label className="text-xs text-white/70 mb-1 block">Date</label>
            <input
              type="date"
              value={formatDateKey(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              max={formatDateKey(new Date())}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/70 mb-1 block">Weight (lbs)</label>
            <input
              type="number"
              placeholder="Enter weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>
        </div>

        {/* Apple Health Info for iOS */}
        {isIOS && (
          <div className="mb-4">
            <button
              onClick={() => setShowHealthKitInfo(true)}
              className="w-full py-2 px-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs hover:bg-blue-500/30 transition-colors"
            >
              📱 About Apple Health Integration
            </button>
          </div>
        )}

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm text-center"
            >
              ✓ Weight saved successfully!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || !weight || parseFloat(weight) <= 0}
          className="w-full py-2.5 bg-white text-[#0a0a0a] rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 text-sm mb-3"
        >
          {isSaving ? "Saving..." : "Save Weight"}
        </button>

        {/* Weight History */}
        {weightHistory.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-white/70 mb-2">Recent Entries</div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {weightHistory.slice(0, 10).map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <div className="text-white text-sm">{formatDate(entry.date)}</div>
                    <div className="text-white/60 text-xs">{entry.weight.toFixed(1)} lbs</div>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.date)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Apple Health Info Modal */}
      <AnimatePresence>
        {showHealthKitInfo && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] rounded-3xl p-5 lg:p-6 border border-white/20 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Apple Health Integration</h3>
                <button
                  onClick={() => setShowHealthKitInfo(false)}
                  className="text-white/60 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 text-sm text-white/80">
                <p>
                  <strong className="text-white">Current Status:</strong> Apple HealthKit cannot be accessed directly from web browsers for security and privacy reasons.
                </p>
                <p>
                  <strong className="text-white">Manual Entry:</strong> You can manually enter your weight here, and it will be saved to your account.
                </p>
                <p>
                  <strong className="text-white">Future Integration:</strong> To integrate with Apple Health, we would need to build a native iOS app that can request HealthKit permissions. This would allow automatic syncing of weight data from your Health app.
                </p>
                <p className="text-xs text-white/60 pt-2">
                  For now, you can manually log your weight, and all data will sync across your devices when you're signed in.
                </p>
              </div>
              <button
                onClick={() => setShowHealthKitInfo(false)}
                className="w-full mt-4 py-2.5 bg-white text-[#0a0a0a] rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WeightTracker;
