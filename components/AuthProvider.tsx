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
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_MODE_KEY = "guestMode";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isGuest,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
    }),
    [session, loading, isGuest]
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
