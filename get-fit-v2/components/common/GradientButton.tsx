/**
 * Animated gradient button component
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { spacing, layout } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { springConfig } from '../../theme/animations';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'energy' | 'power' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const gradientColors = colors.gradients[variant];

  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  };

  const textSizeStyles = {
    small: typography.sizes.small,
    medium: typography.sizes.body,
    large: typography.sizes.h3,
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springConfig.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.snappy);
  };

  React.useEffect(() => {
    opacity.value = withTiming(disabled ? 0.5 : 1, { duration: 200 });
  }, [disabled]);

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.button,
          sizeStyles[size],
          { borderRadius: layout.borderRadius.medium },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize: textSizeStyles[size] },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.touchTargetMin,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});

