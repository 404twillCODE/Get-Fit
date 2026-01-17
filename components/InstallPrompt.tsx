 "use client";

import { useEffect, useRef, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "installPromptDismissedAt";
const DISMISS_DAYS = 7;

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const standaloneMatch = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return standaloneMatch || iosStandalone === true;
};

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isTouchMac = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return isIOS || isAndroid || isTouchMac;
};

const isIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
};

const shouldShowPrompt = () => {
  if (typeof window === "undefined") return false;
  const lastDismissed = localStorage.getItem(DISMISS_KEY);
  if (!lastDismissed) return true;
  const last = Number(lastDismissed);
  if (Number.isNaN(last)) return true;
  const daysSince = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return daysSince >= DISMISS_DAYS;
};

const InstallPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!isMobileDevice() || isStandaloneMode()) return;
    if (!shouldShowPrompt()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fallback for iOS and other browsers without beforeinstallprompt
    if (isIOS()) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    setCanInstall(false);
    dismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-[#0a0a0a] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/60">Get Fit</div>
            <h3 className="text-xl font-semibold">Install the app?</h3>
          </div>
          <button
            onClick={dismiss}
            className="text-white/50 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="text-white/70 text-sm mt-3">
          Add Get Fit to your home screen for faster access, a full-screen app
          experience, and more reliable offline support.
        </p>

        {isIOS() && !canInstall && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
            On iPhone/iPad, tap the Share button in Safari, then choose
            <span className="text-white font-semibold"> Add to Home Screen</span>.
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            Maybe later
          </button>
          {canInstall && (
            <button
              onClick={handleInstall}
              className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-[#0a0a0a] hover:bg-white/90"
            >
              Install app
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
