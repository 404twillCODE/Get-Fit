"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type UserProfile = {
  name?: string;
  age?: number;
  height?: number; // in inches or cm
  currentWeight?: number;
  goalWeight?: number;
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";
  fitnessGoal?: "lose_weight" | "maintain_weight" | "gain_weight" | "build_muscle" | "improve_endurance";
};

const ProfileSetup = ({ 
  onComplete, 
  initialProfile 
}: { 
  onComplete: () => void;
  initialProfile?: UserProfile | null;
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(initialProfile || {});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setError("");
    
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Unable to save profile.");
        setIsSaving(false);
        return;
      }

      // Update user metadata with profile
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          profile: profile,
          profileSetupComplete: true,
        },
      });

      if (updateError) {
        setError(updateError.message);
        setIsSaving(false);
        return;
      }

      onComplete();
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#0a0a0a] rounded-3xl p-6 lg:p-8 border border-white/20 max-w-md sm:max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto -mt-8"
      >
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">👤</div>
          <h3 className="text-xl font-bold mb-2">
            {initialProfile ? "Edit Your Profile" : "Welcome! Let's set up your profile"}
          </h3>
          <p className="text-white/60 text-sm">
            {initialProfile 
              ? "Update your profile information"
              : "Tell us about yourself to personalize your experience"}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-white/70 mb-2 block">Name (optional)</label>
            <input
              type="text"
              placeholder="Your name"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Age</label>
            <input
              type="number"
              placeholder="Your age"
              value={profile.age || ""}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Height (inches)</label>
            <input
              type="number"
              placeholder="Your height in inches"
              value={profile.height || ""}
              onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Current Weight (lbs)</label>
            <input
              type="number"
              placeholder="Your current weight"
              value={profile.currentWeight || ""}
              onChange={(e) => setProfile({ ...profile, currentWeight: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Goal Weight (lbs)</label>
            <input
              type="number"
              placeholder="Your goal weight"
              value={profile.goalWeight || ""}
              onChange={(e) => setProfile({ ...profile, goalWeight: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Activity Level</label>
            <select
              value={profile.activityLevel || ""}
              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as UserProfile["activityLevel"] })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary (little to no exercise)</option>
              <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
              <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">Fitness Goal</label>
            <select
              value={profile.fitnessGoal || ""}
              onChange={(e) => setProfile({ ...profile, fitnessGoal: e.target.value as UserProfile["fitnessGoal"] })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-white/20 focus:outline-none"
            >
              <option value="">Select fitness goal</option>
              <option value="lose_weight">Lose Weight</option>
              <option value="maintain_weight">Maintain Weight</option>
              <option value="gain_weight">Gain Weight</option>
              <option value="build_muscle">Build Muscle</option>
              <option value="improve_endurance">Improve Endurance</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-400">{error}</div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-white text-[#0a0a0a] rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>

        <button
          onClick={onComplete}
          className="w-full mt-3 py-3 bg-white/5 border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors text-sm"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
