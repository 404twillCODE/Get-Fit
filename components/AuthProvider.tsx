"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";
import { ensureUserData } from "@/lib/dataStore";

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
    const guestStored = localStorage.getItem(GUEST_MODE_KEY);
    setIsGuest(guestStored === "true");

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session ?? null);
      if (data.session?.user) {
        setIsGuest(false);
        localStorage.removeItem(GUEST_MODE_KEY);
        await ensureUserData();
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setIsGuest(false);
          localStorage.removeItem(GUEST_MODE_KEY);
          await ensureUserData();
        }
      }
    );

    return () => {
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
