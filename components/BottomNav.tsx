"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const BottomNav = () => {
  const pathname = usePathname();
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const navItems = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Workouts", path: "/workouts", icon: "💪" },
    { name: "Deficit", path: "/calories", icon: "🔥" },
    { name: "Insights", path: "/insights", icon: "📈" },
  ];

  // Normalize pathname to handle basePath and trailing slashes
  const normalizedPathname = pathname?.replace(/\/$/, '') || '/';

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10"
    >
      <div className="max-w-md mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-around h-16 sm:h-16">
          {navItems.map((item) => {
            const normalizedItemPath = item.path === '/' ? '/' : item.path.replace(/\/$/, '');
            const isActive = normalizedPathname === normalizedItemPath || 
                           (normalizedPathname === '' && normalizedItemPath === '/');
            const isPressed = pressedButton === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex-1 flex flex-col items-center justify-center relative min-h-[44px] touch-manipulation cursor-pointer z-10"
                onTouchStart={() => setPressedButton(item.path)}
                onTouchEnd={() => setPressedButton(null)}
                onMouseDown={() => setPressedButton(item.path)}
                onMouseUp={() => setPressedButton(null)}
                onMouseLeave={() => setPressedButton(null)}
              >
                {/* Active highlight - always shows for current route */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[rgb(38,38,38)] rounded-t-2xl pointer-events-none"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ opacity: 1 }}
                  />
                )}
                {/* Press highlight - shows when button is being pressed (only if not active) */}
                {isPressed && !isActive && (
                  <div className="absolute inset-0 bg-[rgb(38,38,38)] rounded-t-2xl opacity-100 pointer-events-none" />
                )}
                <motion.span
                  className="text-xl sm:text-2xl mb-0.5 sm:mb-1 relative z-10 pointer-events-none"
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.icon}
                </motion.span>
                <span
                  className={`text-[10px] sm:text-xs font-medium relative z-10 transition-colors pointer-events-none ${
                    isActive ? "text-white" : "text-white/50"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default BottomNav;

