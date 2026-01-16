"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

const AuthScreen = () => {
  const { signIn, signUp, continueAsGuest } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setStatus("");
    
    // Validate password confirmation for sign up
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setStatus("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setStatus("Password must be at least 6 characters.");
        return;
      }
    }
    
    setIsLoading(true);
    const errorMessage =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
    if (errorMessage) {
      setStatus(errorMessage);
    } else if (mode === "signup") {
      setStatus("Account created. You can now sign in.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6"
      >
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Get Fit</h1>
          <p className="text-white/60 text-sm">
            Sign in to sync your progress or continue as a guest.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 text-sm text-yellow-200">
            Supabase keys are missing. Add env vars to enable account login.
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("signin")}
            className={`flex-1 py-2 rounded-xl text-sm border ${
              mode === "signin"
                ? "bg-white text-[#0a0a0a] border-white"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2 rounded-xl text-sm border ${
              mode === "signup"
                ? "bg-white text-[#0a0a0a] border-white"
                : "bg-white/5 border-white/10 text-white/70"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
            />
          )}
        </div>

        {status && <div className="mt-3 text-xs text-white/70">{status}</div>}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-4 py-3 bg-white text-[#0a0a0a] rounded-2xl font-semibold text-base disabled:opacity-60"
        >
          {isLoading
            ? "Please wait..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </motion.button>

        <div className="mt-6 text-center">
          <button
            onClick={continueAsGuest}
            className="text-sm text-white/70 hover:text-white"
          >
            Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthScreen;
