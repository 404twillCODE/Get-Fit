"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ensureUserData, startPeriodicSync, retryFailedSyncs } from "@/lib/dataStore";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  showProfileSetup: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signInWithOTP: (email: string) => Promise<string | null>;
  verifyOTP: (email: string, token: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updateEmail: (newEmail: string) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  inviteUser: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  logoutGuest: () => void;
  continueAsGuest: () => void;
  completeProfileSetup: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_MODE_KEY = "guestMode";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  useEffect(() => {
    let mounted = true;
    let subscription: { subscription: { unsubscribe: () => void } } | null = null;

    const initAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const guestStored = localStorage.getItem(GUEST_MODE_KEY);
          setIsGuest(guestStored === "true");
        }

        if (!isSupabaseConfigured) {
          if (mounted) setLoading(false);
          return;
        }

        const supabase = getSupabaseClient();
        if (!supabase) {
          if (mounted) setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase.auth.getSession();
          if (!mounted) return;

          if (error) {
            console.error("Auth session error:", error);
            if (mounted) setLoading(false);
            return;
          }

          if (mounted) {
            setSession(data.session ?? null);
              if (data.session?.user) {
                setIsGuest(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem(GUEST_MODE_KEY);
                }
                // Check if profile setup is needed
                const profileSetupComplete = data.session.user.user_metadata?.profileSetupComplete;
                if (!profileSetupComplete) {
                  setShowProfileSetup(true);
                }
                try {
                  await ensureUserData();
                  // Retry any failed syncs when user logs in
                  await retryFailedSyncs();
                } catch (err) {
                  console.error("Error ensuring user data:", err);
                }
              }
            setLoading(false);
          }
        } catch (err) {
          console.error("Error getting session:", err);
          if (mounted) setLoading(false);
        }

        if (mounted && supabase) {
          const { data: subData } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (!mounted) return;
              setSession(newSession);
              if (newSession?.user) {
                setIsGuest(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem(GUEST_MODE_KEY);
                }
                // Check if profile setup is needed
                const profileSetupComplete = newSession.user.user_metadata?.profileSetupComplete;
                if (!profileSetupComplete) {
                  setShowProfileSetup(true);
                }
                try {
                  await ensureUserData();
                  // Retry any failed syncs when user logs in
                  await retryFailedSyncs();
                } catch (err) {
                  console.error("Error ensuring user data:", err);
                }
              }
            }
          );
          subscription = subData;
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Start periodic sync for reliable Supabase uploads
    if (typeof window !== "undefined") {
      startPeriodicSync();
    }

    return () => {
      mounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? error.message : null;
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return error ? error.message : null;
  };

  const signInWithOTP = async (email: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });
    return error ? error.message : null;
  };

  const verifyOTP = async (email: string, token: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return error ? error.message : null;
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    return error ? error.message : null;
  };

  const updateEmail = async (newEmail: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    return error ? error.message : null;
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return error ? error.message : null;
  };

  const inviteUser = async (email: string) => {
    if (!isSupabaseConfigured) {
      return "Supabase is not configured.";
    }
    const supabase = getSupabaseClient();
    if (!supabase) return "Supabase is not configured.";
    // Use magic link to invite user
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        shouldCreateUser: true,
      },
    });
    return error ? error.message : null;
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_MODE_KEY, "true");
    setIsGuest(true);
  };

  const logoutGuest = () => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
    // Clear all local data when logging out of guest mode
    if (typeof window !== "undefined") {
      localStorage.removeItem("deficitEntries");
      localStorage.removeItem("savedWorkouts");
      localStorage.removeItem("workoutHistory");
      localStorage.removeItem("workoutSchedule");
    }
  };

  const completeProfileSetup = () => {
    setShowProfileSetup(false);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isGuest,
      showProfileSetup,
      signIn,
      signUp,
      signInWithOTP,
      verifyOTP,
      resetPassword,
      updateEmail,
      updatePassword,
      inviteUser,
      signOut,
      logoutGuest,
      continueAsGuest,
      completeProfileSetup,
    }),
    [session, loading, isGuest, showProfileSetup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
