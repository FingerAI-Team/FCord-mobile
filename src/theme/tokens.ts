// src/theme/tokens.ts
// 단일 진실: Stitch DESIGN.md의 전체 디자인 시스템 + Hanken Grotesk 폰트
import { TextStyle } from 'react-native';

export const colors = {
  // ── Surface ──────────────────────────────────────
  background: '#fcf8fa',
  surface: '#fcf8fa',
  surfaceDim: '#dcd9db',
  surfaceBright: '#fcf8fa',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f6f3f4',
  surfaceContainer: '#f0edee',
  surfaceContainerHigh: '#eae7e9',
  surfaceContainerHighest: '#e5e2e3',

  // ── On-surface ───────────────────────────────────
  onSurface: '#1b1b1d',
  onSurfaceVariant: '#45464c',
  inverseSurface: '#303031',
  inverseOnSurface: '#f3f0f1',

  // ── Outline ──────────────────────────────────────
  outline: '#76777d',
  outlineVariant: '#c6c6cd',
  surfaceTint: '#575e70',

  // ── Primary ──────────────────────────────────────
  primary: '#000000',
  onPrimary: '#ffffff',
  primaryContainer: '#141b2b',
  onPrimaryContainer: '#7d8497',
  inversePrimary: '#c0c6db',
  primaryFixed: '#dce2f7',
  primaryFixedDim: '#c0c6db',
  onPrimaryFixed: '#141b2b',
  onPrimaryFixedVariant: '#404758',

  // ── Secondary ────────────────────────────────────
  secondary: '#585f6c',
  onSecondary: '#ffffff',
  secondaryContainer: '#dce2f3',
  onSecondaryContainer: '#5e6572',
  secondaryFixed: '#dce2f3',
  secondaryFixedDim: '#c0c7d6',
  onSecondaryFixed: '#151c27',
  onSecondaryFixedVariant: '#404754',

  // ── Tertiary ─────────────────────────────────────
  tertiary: '#000000',
  onTertiary: '#ffffff',
  tertiaryContainer: '#261906',
  onTertiaryContainer: '#968065',
  tertiaryFixed: '#f9debf',
  tertiaryFixedDim: '#dcc2a4',
  onTertiaryFixed: '#261906',
  onTertiaryFixedVariant: '#55442d',

  // ── Error ────────────────────────────────────────
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // ── Background ───────────────────────────────────
  backgroundLight: '#FFFFFF',
  onBackground: '#1b1b1d',
  surfaceLight: '#F9FAFB',
  borderLight: '#E5E7EB',
  textPrimaryLight: '#111827',

  // ── 앱 고유 ──────────────────────────────────────
  accentBlue: '#2563EB',
  recordingRed: '#EF4444',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  dangerRed: '#DC2626',

  // ── 다크모드 (ThemeProvider 도입 전 참조용) ───────
  backgroundDark: '#0B0F19',
  surfaceDark: '#111827',
  surfaceElevatedDark: '#1F2937',
  borderDark: '#1F2937',
  textPrimaryDark: '#F9FAFB',
  accentBlueDark: '#60A5FA',

  // ── 기존 코드 호환 aliases ────────────────────────
  textPrimary: '#111827',
  textOnSurface: '#1b1b1d',
  textSecondary: '#585f6c',
  textOnSecondaryContainer: '#5e6572',
  textTertiary: '#9CA3AF',
  onPrimaryFixed_compat: '#141b2b',
  successBg: '#ECFDF5',
  infoBg: '#EFF6FF',
  pendingBg: '#F3F4F6',
  dangerBg: '#FEF2F2',
} as const;

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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography: Record<
  'display' | 'heading' | 'body' | 'label' | 'caption',
  TextStyle
> = {
  display: {
    fontFamily: 'HankenGrotesk-ExtraBold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'HankenGrotesk-Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: 'HankenGrotesk-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: 'HankenGrotesk-SemiBold',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  caption: {
    fontFamily: 'HankenGrotesk-Medium',
    fontSize: 12,
    lineHeight: 14,
  },
};

export const buttonHeights = {
  primary: 52,
  secondary: 52,
  small: 40,
} as const;

export const inputHeight = 56;
