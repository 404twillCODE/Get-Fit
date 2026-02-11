/**
 * Neon glow effect component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, glowColors } from '../../theme/colors';

interface GlowEffectProps {
  intensity?: 'soft' | 'normal' | 'intense';
  color?: keyof typeof glowColors;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const GlowEffect: React.FC<GlowEffectProps> = ({
  intensity = 'normal',
  color = 'primary',
  style,
  children,
}) => {
  const getGlowStyle = (): ViewStyle => {
    const glowMap = {
      soft: { shadowRadius: 10, shadowOpacity: 0.3 },
      normal: { shadowRadius: 20, shadowOpacity: 0.5 },
      intense: { shadowRadius: 30, shadowOpacity: 0.8 },
    };

    const glow = glowMap[intensity];
    const glowColor = glowColors[color];

    return {
      shadowColor: glowColor.replace('rgba', '').split(',')[0] + ', 1)',
      shadowOffset: { width: 0, height: 0 },
      ...glow,
      elevation: intensity === 'intense' ? 10 : intensity === 'normal' ? 5 : 2,
    };
  };

  return (
    <View style={[styles.container, getGlowStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Glow effect is applied via shadow properties
  },
});

