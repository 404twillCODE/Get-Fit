/**
 * Reusable animated wrapper component
 */

import React from 'react';
import Animated from 'react-native-reanimated';
import { View, ViewProps } from 'react-native';

interface AnimatedViewProps extends ViewProps {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  delay = 0,
  style,
  ...props
}) => {
  return (
    <Animated.View style={style} {...props}>
      {children}
    </Animated.View>
  );
};

