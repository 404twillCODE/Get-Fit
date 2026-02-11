/**
 * Color Palette
 * Combines Minimal Dark, Neon/Cyberpunk, and Sporty/Vibrant aesthetics
 */

export const colors = {
  // Base Colors (Minimal Dark)
  background: '#000000', // Pure black
  surface: '#0a0a0a', // Near-black, subtle contrast
  surfaceElevated: '#1a1a1a', // Slightly lighter for cards
  border: '#2a2a2a', // Subtle borders
  textPrimary: '#ffffff', // Pure white
  textSecondary: '#a0a0a0', // Muted gray
  textTertiary: '#606060', // Very muted

  // Neon Accents (Cyberpunk)
  neonPrimary: '#00ff88', // Electric green/cyan
  neonSecondary: '#ff0080', // Hot pink/magenta
  neonBlue: '#0080ff', // Electric blue
  neonPurple: '#8000ff', // Vibrant purple
  neonOrange: '#ffaa00', // Electric orange

  // Sporty Vibrant (Fitness Energy)
  success: '#00ff88', // Green glow
  active: '#ff0080', // Pink pulse
  strength: '#ffaa00', // Orange energy
  cardio: '#0080ff', // Blue intensity

  // Gradient Colors (for use with expo-linear-gradient)
  gradients: {
    primary: ['#00ff88', '#0080ff'],
    energy: ['#ff0080', '#ffaa00'],
    power: ['#8000ff', '#ff0080'],
    success: ['#00ff88', '#00cc66'],
  },
} as const;

// Helper function to get rgba colors for glows
export const getGlowColor = (color: string, opacity: number = 0.5): string => {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgb = hexToRgb(color);
  if (!rgb) return `rgba(0, 255, 136, ${opacity})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

// Glow color presets
export const glowColors = {
  primary: getGlowColor(colors.neonPrimary, 0.5),
  primaryIntense: getGlowColor(colors.neonPrimary, 0.8),
  primarySoft: getGlowColor(colors.neonPrimary, 0.1),
  secondary: getGlowColor(colors.neonSecondary, 0.5),
  blue: getGlowColor(colors.neonBlue, 0.5),
} as const;

