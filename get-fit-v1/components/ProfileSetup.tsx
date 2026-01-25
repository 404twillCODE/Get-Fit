"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";
<<<<<<< Updated upstream:get-fit-v1/components/ProfileSetup.tsx
import { type UserProfile } from "@/lib/storage";
=======
>>>>>>> Stashed changes:components/ProfileSetup.tsx

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
  const [success, setSuccess] = useState(false);

  // Convert height from inches to feet/inches for display
  const heightInInches = profile.height || 0;
  const heightFeet = Math.floor(heightInInches / 12);
  const heightInches = Math.round(heightInInches % 12);

  // Handle height changes (convert feet + inches to total inches)
  const handleHeightChange = (feet: number | undefined, inches: number | undefined) => {
    const totalInches = (feet || 0) * 12 + (inches || 0);
    setProfile({ ...profile, height: totalInches > 0 ? totalInches : undefined });
  };

  const handleSave = async () => {
    // Prevent multiple simultaneous saves
    if (isSaving) {
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccess(false);
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isSaving) {
        console.warn("Profile save timeout - forcing completion");
        setIsSaving(false);
        setError("Save is taking longer than expected. Please try again.");
      }
    }, 15000); // 15 second timeout
    
    try {
      if (user) {
<<<<<<< Updated upstream:get-fit-v1/components/ProfileSetup.tsx
        // Save to Supabase user metadata
        const supabase = getSupabaseClient();
        if (!supabase) {
          clearTimeout(timeoutId);
          setError("Unable to save profile. Supabase not configured.");
=======
        // Save to Supabase user metadata for authenticated users
        const supabase = getSupabaseClient();
        if (!supabase) {
          setError("Unable to save profile.");
>>>>>>> Stashed changes:components/ProfileSetup.tsx
          setIsSaving(false);
          return;
        }

<<<<<<< Updated upstream:get-fit-v1/components/ProfileSetup.tsx
        // Save directly to user metadata with timeout protection
=======
        console.log("Saving profile to Supabase:", profile);
        
        // Ensure we have a valid session before updating
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          console.error("No valid session found:", sessionError);
          setError("Session expired. Please refresh the page and try again.");
          setIsSaving(false);
          return;
        }
        
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout. Please try again.")), 10000);
        });

        // Make the update request with error handling and timeout
>>>>>>> Stashed changes:components/ProfileSetup.tsx
        const updatePromise = supabase.auth.updateUser({
          data: {
            profile: profile,
            profileSetupComplete: true,
          },
        });

<<<<<<< Updated upstream:get-fit-v1/components/ProfileSetup.tsx
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );

        const { data, error: updateError } = await Promise.race([
          updatePromise,
          timeoutPromise,
        ]) as Awaited<ReturnType<typeof supabase.auth.updateUser>>;

        clearTimeout(timeoutId);

        if (updateError) {
          console.error("Supabase update error:", updateError);
          setError(updateError.message || "Failed to save profile. Please try again.");
          setIsSaving(false);
          return;
        }

        // Success - refresh session in background (non-blocking)
        supabase.auth.getSession().catch(err => {
          console.warn("Session refresh failed (non-critical):", err);
        });
        
        // Show success and close immediately
        setSuccess(true);
        setIsSaving(false);
        
        // Use requestAnimationFrame to ensure state updates are processed
        requestAnimationFrame(() => {
          onComplete();
        });
=======
        const updateResult = await Promise.race([updatePromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.updateUser>>;

        const { data, error: updateError } = updateResult;

        console.log("Update result:", { data, error: updateError });

        if (updateError) {
          console.error("Supabase update error:", updateError);
          
          // Handle 406 Not Acceptable error specifically
          if (updateError.status === 406 || updateError.message?.includes("406")) {
            setError("Unable to save profile. Please refresh the page and try again.");
            setIsSaving(false);
            return;
          }
          
          // If it's an abort error, try once more
          if (updateError.message?.toLowerCase().includes("abort") || updateError.name === "AbortError") {
            console.log("Abort error detected, retrying once...");
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before retry
            
            const retryPromise = supabase.auth.updateUser({
              data: {
                profile: profile,
                profileSetupComplete: true,
              },
            });
            
            const retryResult = await Promise.race([retryPromise, timeoutPromise]) as Awaited<ReturnType<typeof supabase.auth.updateUser>>;
            
            if (retryResult.error) {
              setError("Connection issue. Please try again.");
              setIsSaving(false);
              return;
            }
            // Retry succeeded, continue to success
          } else {
            setError(updateError.message || "Failed to save profile.");
            setIsSaving(false);
            return;
          }
        }
        
        // Refresh the session to ensure metadata is updated
        try {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn("Session refresh warning:", refreshError);
            // Don't fail the save if refresh fails, the update might still have worked
          }
        } catch (refreshErr) {
          console.warn("Session refresh error:", refreshErr);
          // Continue anyway
        }
        
        console.log("Profile saved successfully");
        // Success - show success message briefly, then close
        setSuccess(true);
        setIsSaving(false);
        setTimeout(() => {
          onComplete();
        }, 1000);
>>>>>>> Stashed changes:components/ProfileSetup.tsx
      } else {
        // Save to localStorage for guest users
        try {
          localStorage.setItem("guestProfile", JSON.stringify(profile));
          localStorage.setItem("guestProfileSetupComplete", "true");
          clearTimeout(timeoutId);
          setSuccess(true);
          setIsSaving(false);
          
          // Close after brief success display
          setTimeout(() => {
            onComplete();
          }, 500);
        } catch (storageError) {
          clearTimeout(timeoutId);
          console.error("localStorage error:", storageError);
          setError("Failed to save profile to local storage.");
          setIsSaving(false);
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Error saving profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save profile. Please try again.";
      setError(errorMessage);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0a] rounded-3xl p-5 lg:p-6 border border-white/20 max-w-md w-full shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="text-center mb-4">
          <div className="text-2xl mb-1">👤</div>
          <h3 className="text-lg font-bold mb-1">
            {initialProfile ? "Edit Your Profile" : "Welcome! Let's set up your profile"}
          </h3>
          <p className="text-white/60 text-xs">
            {initialProfile 
              ? "Update your profile information"
              : "Tell us about yourself to personalize your experience"}
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/70 mb-1 block">Name (optional)</label>
              <input
                type="text"
                placeholder="Your name"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/70 mb-1 block">Age</label>
              <input
                type="number"
                placeholder="Age"
                value={profile.age || ""}
                onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                min="1"
                max="120"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">Height</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Feet"
                  value={heightFeet || ""}
                  onChange={(e) => {
                    const feet = parseInt(e.target.value) || 0;
                    handleHeightChange(feet, heightInches);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                  min="0"
                  max="10"
                />
                <span className="text-xs text-white/50 mt-1 block">ft</span>
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Inches"
                  value={heightInches || ""}
                  onChange={(e) => {
                    const inches = parseInt(e.target.value) || 0;
                    handleHeightChange(heightFeet, inches);
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
                  min="0"
                  max="11"
                />
                <span className="text-xs text-white/50 mt-1 block">in</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">Current Weight (lbs)</label>
            <input
              type="number"
              placeholder="Weight"
              value={profile.currentWeight || ""}
              onChange={(e) => setProfile({ ...profile, currentWeight: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">Goal Weight (lbs)</label>
            <input
              type="number"
              placeholder="Your goal weight"
              value={profile.goalWeight || ""}
              onChange={(e) => setProfile({ ...profile, goalWeight: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none"
              min="1"
              step="0.1"
            />
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">Activity Level</label>
            <div className="relative">
              <select
                value={profile.activityLevel || ""}
                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as UserProfile["activityLevel"] })}
                className="w-full px-3 py-2 pr-8 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4L6 8L10 4' stroke='rgba(255,255,255,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '12px 12px'
                }}
              >
                <option value="" className="bg-[#0a0a0a] text-white">Select activity level</option>
                <option value="sedentary" className="bg-[#0a0a0a] text-white">Sedentary (little to no exercise)</option>
                <option value="lightly_active" className="bg-[#0a0a0a] text-white">Lightly Active (light exercise 1-3 days/week)</option>
                <option value="moderately_active" className="bg-[#0a0a0a] text-white">Moderately Active (moderate exercise 3-5 days/week)</option>
                <option value="very_active" className="bg-[#0a0a0a] text-white">Very Active (hard exercise 6-7 days/week)</option>
                <option value="extremely_active" className="bg-[#0a0a0a] text-white">Extremely Active (very hard exercise, physical job)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/70 mb-1 block">Fitness Goal</label>
            <div className="relative">
              <select
                value={profile.fitnessGoal || ""}
                onChange={(e) => setProfile({ ...profile, fitnessGoal: e.target.value as UserProfile["fitnessGoal"] })}
                className="w-full px-3 py-2 pr-8 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-white/20 focus:outline-none appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2 4L6 8L10 4' stroke='rgba(255,255,255,0.7)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '12px 12px'
                }}
              >
                <option value="" className="bg-[#0a0a0a] text-white">Select fitness goal</option>
                <option value="lose_weight" className="bg-[#0a0a0a] text-white">Lose Weight</option>
                <option value="maintain_weight" className="bg-[#0a0a0a] text-white">Maintain Weight</option>
                <option value="gain_weight" className="bg-[#0a0a0a] text-white">Gain Weight</option>
                <option value="build_muscle" className="bg-[#0a0a0a] text-white">Build Muscle</option>
                <option value="improve_endurance" className="bg-[#0a0a0a] text-white">Improve Endurance</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-red-400">{error}</div>
        )}
        
        {success && (
          <div className="mb-3 text-xs text-green-400">✓ Profile saved successfully!</div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 bg-white text-[#0a0a0a] rounded-lg font-semibold hover:bg-white/90 transition-colors disabled:opacity-60 text-sm"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileSetup;
