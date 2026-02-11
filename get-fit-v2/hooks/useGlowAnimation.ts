/**
 * Custom hook for glow animation effects
 */

import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';

interface UseGlowAnimationOptions {
  intensity?: number;
  duration?: number;
  enabled?: boolean;
}

export const useGlowAnimation = ({
  intensity = 0.5,
  duration = 2000,
  enabled = true,
}: UseGlowAnimationOptions = {}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (enabled) {
      progress.value = withRepeat(
        withTiming(1, { duration, easing: (t) => t }),
        -1,
        true // reverse
      );
    } else {
      progress.value = 0;
    }
  }, [enabled, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [intensity * 0.5, intensity]);
    return {
      opacity,
    };
  });

  return { animatedStyle, progress };
};

