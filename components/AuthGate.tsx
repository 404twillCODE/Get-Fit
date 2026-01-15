"use client";

import { useAuth } from "@/components/AuthProvider";
import AuthScreen from "@/components/AuthScreen";

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { session, loading, isGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/60">
        Loading...
      </div>
    );
  }

  if (!session && !isGuest) {
    return <AuthScreen />;
  }

  return <>{children}</>;
};

export default AuthGate;
