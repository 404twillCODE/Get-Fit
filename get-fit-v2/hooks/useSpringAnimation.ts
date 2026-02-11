/**
 * Custom hook for spring animations
 */

import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { springConfig } from '../theme/animations';

interface UseSpringAnimationOptions {
  config?: keyof typeof springConfig;
  initialValue?: number;
}

export const useSpringAnimation = ({
  config = 'gentle',
  initialValue = 0,
}: UseSpringAnimationOptions = {}) => {
  const translateY = useSharedValue(initialValue);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const animateIn = () => {
    translateY.value = withSpring(0, springConfig[config]);
    scale.value = withSpring(1, springConfig[config]);
    opacity.value = withSpring(1, springConfig[config]);
  };

  const animateOut = () => {
    translateY.value = withSpring(initialValue, springConfig[config]);
    scale.value = withSpring(0.9, springConfig[config]);
    opacity.value = withSpring(0, springConfig[config]);
  };

  const pressIn = () => {
    scale.value = withSpring(0.95, springConfig.snappy);
  };

  const pressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return {
    animatedStyle,
    animateIn,
    animateOut,
    pressIn,
    pressOut,
  };
};

