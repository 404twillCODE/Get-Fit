"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { loadAppData, updateAppData } from "@/lib/dataStore";

interface NutritionData {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

interface FitnessData {
  totalCalories: number;
}

interface DeficitEntry {
  date: string;
  nutrition?: NutritionData;
  fitness?: FitnessData;
  caloriesEaten: number;
  caloriesBurned: number;
  deficit: number;
}

const DeficitCalculator = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<DeficitEntry[]>([]);
  const [stats, setStats] = useState({ week: 0, month: 0, year: 0 });
  const [currentEntry, setCurrentEntry] = useState<DeficitEntry | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  // Form states
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    calories: 0,
    fat: 0,
    carbs: 0,
    protein: 0,
  });
  const [fitnessData, setFitnessData] = useState<FitnessData>({
    totalCalories: 0,
  });

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    loadTodayData();
    calculateStats();
  }, [currentDate, entries]);

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const loadEntries = async () => {
    const data = await loadAppData();
    setEntries(data.deficitEntries);
  };

  const loadTodayData = () => {
    const dateKey = formatDateKey(currentDate);
    const entry = entries.find((e) => e.date === dateKey);
    if (entry) {
      setCurrentEntry(entry);
      if (entry.nutrition) {
        // Ensure we only load the fields we care about (calories, fat, carbs, protein)
        setNutritionData({
          calories: entry.nutrition.calories || 0,
          fat: entry.nutrition.fat || 0,
          carbs: entry.nutrition.carbs || 0,
          protein: entry.nutrition.protein || 0,
        });
      }
      if (entry.fitness) {
        setFitnessData(entry.fitness);
      }
    } else {
      setCurrentEntry(null);
      setNutritionData({
        calories: 0,
        fat: 0,
        carbs: 0,
        protein: 0,
      });
      setFitnessData({
        totalCalories: 0,
      });
    }
  };

  const handleSaveClick = () => {
    setShowSaveConfirm(true);
  };

  const saveEntry = async () => {
    setShowSaveConfirm(false);
    
    try {
      const caloriesEaten = nutritionData.calories || 0;
      const caloriesBurned = fitnessData.totalCalories || 0;
      const deficit = caloriesEaten - caloriesBurned;
      const dateKey = formatDateKey(currentDate);

      // Ensure we save all nutrition data, even if some values are 0
      const nutritionToSave = {
        calories: nutritionData.calories || 0,
        fat: nutritionData.fat || 0,
        carbs: nutritionData.carbs || 0,
        protein: nutritionData.protein || 0,
      };

      const newEntry: DeficitEntry = {
        date: dateKey,
        nutrition: nutritionToSave,
        fitness: fitnessData,
        caloriesEaten,
        caloriesBurned,
        deficit,
      };

      console.log("Saving entry:", newEntry);

      // Overwrite existing entry for the same date if it exists
      const updatedEntries = entries.filter((e) => e.date !== dateKey);
      updatedEntries.push(newEntry);
      updatedEntries.sort((a, b) => b.date.localeCompare(a.date));

      await updateAppData((current) => ({
        ...current,
        deficitEntries: updatedEntries,
      }));
      
      setEntries(updatedEntries);
      setCurrentEntry(newEntry);
      calculateStats();
      
      // Reload today's data to show saved values in inputs
      // Don't clear - keep the values visible so users can see what they entered
      // The data will persist in the inputs since loadTodayData will populate them
      
      // Show success message
      setSaveMessage("✓ Data saved!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving entry:", error);
      setSaveMessage("✗ Error saving. Please try again.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const weekTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekStart && entryDate <= now;
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    const monthTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.getFullYear() === currentYear &&
          entryDate.getMonth() === currentMonth
        );
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    const yearTotal = entries
      .filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.deficit, 0);

    setStats({ week: weekTotal, month: monthTotal, year: yearTotal });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    if (newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const todayDeficit =
    (nutritionData.calories || 0) - (fitnessData.totalCalories || 0);
  const isToday = formatDateKey(currentDate) === formatDateKey(new Date());
  const canGoNext = formatDateKey(currentDate) < formatDateKey(new Date());

  return (
    <div className="max-w-md lg:max-w-7xl mx-auto min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-6 px-4 sm:px-6 lg:px-8"
      >
        <h1 className="text-3xl lg:text-4xl font-bold mb-6">Deficit Calculator</h1>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeDate(-1)}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold hover:bg-white/10 transition-colors"
          >
            ‹
          </button>
          <div className="flex-1 text-center mx-4">
            <div className="text-lg font-semibold">
              {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
            </div>
            <div className="text-sm text-white/60">
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={!canGoNext}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
        {!isToday && (
          <button
            onClick={goToToday}
            className="w-full py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            Go to Today
          </button>
        )}
      </motion.header>

      {/* Data Entry Section - Desktop: Side by Side */}
      <div className="px-4 sm:px-6 lg:px-8 mb-6 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Nutrition Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-sm lg:text-base mb-4">🍎 Nutrition Data</div>
          
          {/* Calories - Main Focus */}
          <div className="mb-4">
            <label className="text-white text-sm lg:text-base font-medium mb-2 block">Calories</label>
            <input
              type="number"
              value={nutritionData.calories || ""}
              onChange={(e) =>
                setNutritionData({ ...nutritionData, calories: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-3 lg:py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-lg lg:text-xl font-semibold focus:border-white/40 focus:outline-none transition-colors"
              placeholder="Enter calories"
            />
          </div>

          {/* Carbs, Protein, Fat - Secondary/Optional */}
          <div className="grid grid-cols-3 gap-2 lg:gap-3 opacity-60">
            <div>
              <label className="text-white/40 text-xs lg:text-sm mb-1 block">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={nutritionData.carbs || ""}
                onChange={(e) =>
                  setNutritionData({ ...nutritionData, carbs: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2 py-1.5 lg:py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs lg:text-sm focus:border-white/20 focus:outline-none transition-colors"
                placeholder="Carbs"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs lg:text-sm mb-1 block">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={nutritionData.protein || ""}
                onChange={(e) =>
                  setNutritionData({ ...nutritionData, protein: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2 py-1.5 lg:py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs lg:text-sm focus:border-white/20 focus:outline-none transition-colors"
                placeholder="Protein"
              />
            </div>
            <div>
              <label className="text-white/40 text-xs lg:text-sm mb-1 block">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                value={nutritionData.fat || ""}
                onChange={(e) =>
                  setNutritionData({ ...nutritionData, fat: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2 py-1.5 lg:py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-xs lg:text-sm focus:border-white/20 focus:outline-none transition-colors"
                placeholder="Fat"
              />
            </div>
          </div>
        </motion.div>

        {/* Fitness Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 rounded-2xl p-5 lg:p-6 border border-white/10"
        >
          <div className="text-white/60 text-sm lg:text-base mb-3 lg:mb-4">⌚ Fitness Tracker</div>
          <input
            type="number"
            value={fitnessData.totalCalories || ""}
            onChange={(e) =>
              setFitnessData({ ...fitnessData, totalCalories: parseInt(e.target.value) || 0 })
            }
            className="w-full px-4 py-3 lg:py-4 bg-white/10 border border-white/20 rounded-xl text-white text-base lg:text-lg focus:border-white/40 focus:outline-none transition-colors"
            placeholder="Enter total calories burned"
          />
        </motion.div>
      </div>

      {/* Current Data Display */}
      {(nutritionData.calories > 0 || fitnessData.totalCalories > 0) && (
        <div className="px-4 sm:px-6 lg:px-8 mb-6 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
          {nutritionData.calories > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="text-white/60 text-xs mb-2">Nutrition Data</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Calories: <span className="text-white font-semibold">{nutritionData.calories}</span></div>
                {nutritionData.fat > 0 && <div>Fat: <span className="text-white">{nutritionData.fat}g</span></div>}
                {nutritionData.carbs > 0 && <div>Carbs: <span className="text-white">{nutritionData.carbs}g</span></div>}
                {nutritionData.protein > 0 && <div>Protein: <span className="text-white">{nutritionData.protein}g</span></div>}
              </div>
            </motion.div>
          )}

          {fitnessData.totalCalories > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10"
            >
              <div className="text-white/60 text-xs mb-2">Fitness Data</div>
              <div className="text-sm">
                <div>Total Calories: <span className="text-white font-semibold">{fitnessData.totalCalories}</span></div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="px-6 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSaveClick}
          className="w-full py-4 bg-white text-[#0a0a0a] rounded-2xl font-semibold text-lg hover:bg-white/90 transition-colors"
        >
          Save Day
        </motion.button>
        {saveMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`mt-4 rounded-xl p-4 text-center font-semibold text-base ${
              saveMessage.includes("Error")
                ? "bg-red-500/20 border border-red-500/30 text-red-400"
                : "bg-green-500/20 border border-green-500/30 text-green-400"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">{saveMessage.includes("Error") ? "✗" : "✓"}</span>
              <span>{saveMessage.replace(/^[✓✗]\s*/, "")}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Section */}
      <div className="px-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 border border-white/10 mb-4"
        >
          <div className="text-white/60 text-sm mb-2">
            {isToday ? "Today's Deficit" : "Day's Deficit"}
          </div>
          <div
            className={`text-5xl font-bold ${
              todayDeficit <= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {todayDeficit >= 0 ? "+" : ""}
            {Math.round(todayDeficit).toLocaleString()}
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "This Week", value: stats.week },
            { label: "This Month", value: stats.month },
            { label: "This Year", value: stats.year },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center"
            >
              <div className="text-white/60 text-xs mb-2">{stat.label}</div>
              <div
                className={`text-2xl font-bold ${
                  stat.value < 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.value >= 0 ? "+" : ""}
                {Math.round(stat.value).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="px-6 pb-6">
        <h2 className="text-xl font-bold mb-4">Recent Days</h2>
        <div className="space-y-3">
          {entries.slice(0, 7).map((entry, index) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => {
                setCurrentDate(new Date(entry.date));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-white/5 rounded-xl p-4 border border-white/10 active:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-white/60">
                    {entry.caloriesEaten} eaten • {entry.caloriesBurned} burned
                  </div>
                </div>
                <div
                  className={`text-xl font-bold ${
                    entry.deficit < 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {entry.deficit >= 0 ? "+" : ""}
                  {Math.round(entry.deficit)}
                </div>
              </div>
            </motion.div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-8 text-white/40">
              No entries yet. Enter data manually!
            </div>
          )}
        </div>
      </div>

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSaveConfirm(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0a0a0a] rounded-3xl p-6 border border-white/20 max-w-sm w-full shadow-2xl"
              >
                <div className="text-center mb-6">
                  <div className="text-2xl mb-2">💾</div>
                  <h3 className="text-xl font-bold mb-2">Save Data?</h3>
                  <p className="text-white/60 text-sm">
                    {entries.find((e) => e.date === formatDateKey(currentDate))
                      ? `This will overwrite existing data for ${currentDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}.`
                      : `Save data for ${currentDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}?`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSaveConfirm(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEntry}
                    className="flex-1 py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors"
                  >
                    Save
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


export default DeficitCalculator;

