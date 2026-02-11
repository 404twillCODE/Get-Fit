/**
 * Animation Presets
 * Using react-native-reanimated compatible configs
 */

import { Easing } from 'react-native-reanimated';

// Spring animation configs
export const springConfig = {
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  },
  snappy: {
    damping: 25,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

// Timing animation configs
export const timingConfig = {
  fast: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  medium: {
    duration: 300,
    easing: Easing.inOut(Easing.cubic),
  },
  slow: {
    duration: 400,
    easing: Easing.inOut(Easing.cubic),
  },
} as const;

// Common animation values
export const animationValues = {
  // Scale
  scalePress: 0.95,
  scaleHover: 1.02,
  scaleBounce: 1.2,
  scalePulse: 1.1,

  // Translation
  liftAmount: -4,
  slideAmount: 20,

  // Opacity
  fadeIn: 1,
  fadeOut: 0,
} as const;

// Animation durations (ms)
export const durations = {
  instant: 100,
  fast: 200,
  medium: 300,
  slow: 400,
  verySlow: 600,
} as const;

