// Design tokens — Stitch tailwind config과 1:1 매칭.
// 단일 진실: 모든 화면/컴포넌트는 이 모듈에서 import한다.
// docs/design-system.md 참조.

import { TextStyle } from 'react-native';

export const colorsLight = {
  background: '#FFFFFF',
  surface: '#fcf8fa',
  surfaceContainer: '#f0edee',
  surfaceContainerLow: '#f6f3f4',
  surfaceContainerLowest: '#FFFFFF',

  borderLight: '#E5E7EB',
  outlineVariant: '#c6c6cd',

  textPrimary: '#111827',
  textOnSurface: '#1b1b1d',
  textSecondary: '#585f6c',
  textOnSecondaryContainer: '#5e6572',
  textTertiary: '#9CA3AF',

  primary: '#000000',
  onPrimary: '#FFFFFF',
  secondaryContainer: '#dce2f3',

  accentBlue: '#2563EB',
  recordingRed: '#EF4444',
  dangerRed: '#DC2626',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',

  // status badge backgrounds (light tint)
  successBg: '#ECFDF5',
  infoBg: '#EFF6FF',
  pendingBg: '#F3F4F6',
  dangerBg: '#FEF2F2',
} as const;

export const colorsDark = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceContainer: '#1F2937',
  surfaceContainerLow: '#1F2937',
  surfaceContainerLowest: '#111827',

  borderLight: '#1F2937',
  outlineVariant: '#374151',

  textPrimary: '#F9FAFB',
  textOnSurface: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textOnSecondaryContainer: '#9CA3AF',
  textTertiary: '#6B7280',

  primary: '#FFFFFF',
  onPrimary: '#0B0F19',
  secondaryContainer: '#1F2937',

  accentBlue: '#60A5FA',
  recordingRed: '#F87171',
  dangerRed: '#F87171',
  successGreen: '#34D399',
  warningAmber: '#FBBF24',

  successBg: '#064E3B',
  infoBg: '#1E3A8A',
  pendingBg: '#1F2937',
  dangerBg: '#7F1D1D',
} as const;

export type ColorScheme = typeof colorsLight;
export const colors = colorsLight; // 기본 = light. 다크모드는 ThemeProvider 도입 시 분기.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// fontFamily는 RN 기본(시스템) 사용. iOS=SF Pro, Android=Roboto. Pretendard는 추후 폰트 번들 시 교체.
export const typography: Record<
  'display' | 'heading' | 'body' | 'label' | 'caption',
  TextStyle
> = {
  display: { fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 16, letterSpacing: 0.4 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 15 },
};

// 기성 컴포넌트 프리셋 — 자주 쓰이는 조합을 한 줄로
export const buttonHeights = {
  primary: 52,
  secondary: 52,
  small: 40,
} as const;

export const inputHeight = 56;
