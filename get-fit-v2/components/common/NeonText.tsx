/**
 * Neon text component with glow effect
 */

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, glowColors } from '../../theme/colors';

interface NeonTextProps {
  children: React.ReactNode;
  color?: keyof typeof colors | string;
  intensity?: 'soft' | 'normal' | 'intense';
  style?: TextStyle;
}

export const NeonText: React.FC<NeonTextProps> = ({
  children,
  color = 'neonPrimary',
  intensity = 'normal',
  style,
}) => {
  const getTextColor = (): string => {
    if (typeof color === 'string' && color.startsWith('#')) {
      return color;
    }
    return (colors as any)[color] || colors.neonPrimary;
  };

  const getShadowStyle = (): TextStyle => {
    const textColor = getTextColor();
    const shadowMap = {
      soft: { textShadowRadius: 5, textShadowColor: textColor + '80' },
      normal: { textShadowRadius: 10, textShadowColor: textColor + 'CC' },
      intense: { textShadowRadius: 15, textShadowColor: textColor + 'FF' },
    };

    return {
      ...shadowMap[intensity],
      textShadowOffset: { width: 0, height: 0 },
    };
  };

  return (
    <Text style={[styles.text, { color: getTextColor() }, getShadowStyle(), style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    // Glow effect applied via textShadow
  },
});

