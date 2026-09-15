export const colors = {
  bg: '#080B10',
  bgDeep: '#05070A',
  card: '#0F141B',
  cardAlt: '#161D27',
  cardElevated: '#1A2230',
  border: 'rgba(255, 255, 255, 0.06)',
  borderBright: 'rgba(255, 255, 255, 0.10)',
  borderHairline: 'rgba(255, 255, 255, 0.04)',
  text: '#F4F6F8',
  textDim: '#8A96A3',
  textMuted: '#5A6675',
  primary: '#3B82F6',
  primaryDim: '#1E4FA8',
  primaryGlow: 'rgba(59, 130, 246, 0.4)',
  success: '#34D399',
  successDim: '#1A8A4A',
  successGlow: 'rgba(52, 211, 153, 0.3)',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerBg: 'rgba(248, 113, 113, 0.08)',
  dangerGlow: 'rgba(248, 113, 113, 0.25)',
  gold: '#FBBF24',
  goldGlow: 'rgba(251, 191, 36, 0.2)',
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
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  pill: 999,
} as const;

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  elevated: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
  glow: '0 0 32px rgba(59, 130, 246, 0.3), 0 4px 16px rgba(59, 130, 246, 0.15)',
  goldGlow: '0 0 32px rgba(251, 191, 36, 0.15), 0 4px 16px rgba(251, 191, 36, 0.1)',
  inner: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)',
} as const;

export const motion = {
  spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
  springFast: 'cubic-bezier(0.32, 0.72, 0, 1)',
  easeOut: 'cubic-bezier(0.25, 1, 0.5, 1)',
  easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  duration: {
    fast: 200,
    normal: 320,
    slow: 480,
  },
} as const;
