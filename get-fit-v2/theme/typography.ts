/**
 * Typography System
 */

export const typography = {
  // Font Families
  fontFamily: {
    primary: 'System', // Will use Inter or SF Pro Display on native
    mono: 'monospace', // For numbers/stats
  },

  // Type Scale
  sizes: {
    hero: 48,
    h1: 32,
    h2: 24,
    h3: 20,
    body: 16,
    small: 14,
    tiny: 12,
  },

  // Line Heights
  lineHeights: {
    hero: 56,
    h1: 40,
    h2: 32,
    h3: 28,
    body: 24,
    small: 20,
    tiny: 16,
  },

  // Letter Spacing
  letterSpacing: {
    headings: -0.02,
    body: 0,
    small: 0.01,
  },

  // Font Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

// Helper function to create text style objects
export const createTextStyle = (
  size: keyof typeof typography.sizes,
  weight: keyof typeof typography.weights = 'regular'
) => ({
  fontSize: typography.sizes[size],
  lineHeight: typography.lineHeights[size],
  letterSpacing: typography.letterSpacing[size === 'hero' || size === 'h1' || size === 'h2' ? 'headings' : size === 'small' || size === 'tiny' ? 'small' : 'body'],
  fontWeight: typography.weights[weight],
  fontFamily: size === 'hero' || size === 'h1' ? typography.fontFamily.primary : typography.fontFamily.primary,
});

