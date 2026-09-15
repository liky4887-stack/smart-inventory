export const colors = {
  bg: '#0A0A0A',
  bgDeep: '#070707',
  card: '#151515',
  cardAlt: '#1C1C1C',
  cardElevated: '#242424',
  border: '#2A2A2A',
  borderBright: '#3A3A3A',
  borderHairline: '#222222',
  text: '#F5F5F5',
  textDim: '#969696',
  textMuted: '#666666',
  primary: '#2A5C4A',
  primaryDim: '#1E4033',
  primaryGlow: 'rgba(42, 92, 74, 0.18)',
  success: '#34C759',
  successDim: '#237A38',
  successGlow: 'rgba(52, 199, 89, 0.14)',
  warning: '#FF9F0A',
  danger: '#FF453A',
  dangerBg: '#2A1010',
  dangerGlow: 'rgba(255, 69, 58, 0.14)',
  gold: '#C5A059',
  goldGlow: 'rgba(197, 160, 89, 0.14)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const shadows = {
  card: '0 1px 2px rgba(0,0,0,0.28)',
  elevated: '0 8px 24px rgba(0,0,0,0.28)',
  glow: '0 4px 16px rgba(42, 92, 74, 0.14)',
  goldGlow: '0 4px 16px rgba(197, 160, 89, 0.12)',
  inner: 'inset 0 1px 0 rgba(255,255,255,0.04)',
} as const;

export const motion = {
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
  springFast: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  duration: {
    fast: 160,
    normal: 280,
    slow: 420,
  },
} as const;
