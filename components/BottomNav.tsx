"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  
  // Find active index for smooth highlight animation
  const activeIndex = navItems.findIndex((item) => {
    const normalizedItemPath = item.path === '/' ? '/' : item.path.replace(/\/$/, '');
    return normalizedPathname === normalizedItemPath || 
           (normalizedPathname === '' && normalizedItemPath === '/');
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/98 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-md mx-auto px-2 sm:px-4 relative">
        {/* Animated highlight background - moves smoothly between tabs */}
        <motion.div
          className="absolute inset-y-0 bg-[rgb(38,38,38)] rounded-t-2xl pointer-events-none"
          initial={false}
          animate={{
            x: activeIndex >= 0 ? `${(100 / navItems.length) * activeIndex}%` : '0%',
            width: `${100 / navItems.length}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
          }}
          style={{
            left: 0,
          }}
        />
        
        <div className="flex items-center justify-around h-16 sm:h-16 relative">
          {navItems.map((item, index) => {
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
                {/* Press highlight - shows when button is being pressed (only if not active) */}
                {isPressed && !isActive && (
                  <div className="absolute inset-0 bg-[rgb(38,38,38)] rounded-t-2xl opacity-100 pointer-events-none" />
                )}
                <motion.span
                  className="text-xl sm:text-2xl mb-0.5 sm:mb-1 relative z-10 pointer-events-none"
                  animate={{ 
                    scale: isActive ? 1.15 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {item.icon}
                </motion.span>
                <motion.span
                  className={`text-[10px] sm:text-xs font-medium relative z-10 transition-colors pointer-events-none ${
                    isActive ? "text-white font-semibold" : "text-white/50"
                  }`}
                  animate={{
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;

