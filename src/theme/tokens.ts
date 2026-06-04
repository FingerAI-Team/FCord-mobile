// src/theme/tokens.ts
// 단일 진실: Stitch DESIGN.md의 전체 디자인 시스템 + Hanken Grotesk 폰트
import { TextStyle } from 'react-native';

export const colors = {
  // ── Surface ──────────────────────────────────────
  background: '#f5f5f5',
  surface: '#f5f5f5',
  surfaceDim: '#dcd9db',
  surfaceBright: '#f5f5f5',
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

  // ── Primary (HTML #111 모노크롬 테마) ───────────────
  primary: '#111111',
  primaryDark: '#000000',
  primaryTint: '#f0f0f0',
  onPrimary: '#ffffff',
  primaryContainer: '#141b2b',
  onPrimaryContainer: '#7d8497',
  inversePrimary: '#c0c6db',
  primaryFixed: '#f0f0f0',
  primaryFixedDim: '#e0e0e0',
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
  surfaceLight: '#f5f5f5',
  borderLight: '#e0e0e0',
  textPrimaryLight: '#111111',

  // ── 앱 고유 (HTML 모노크롬 테마) ──────────────────
  accentBlue: '#2E8BD6',      // 링크/포커스용 (waveform 등 한정 사용)
  trackGray: '#f0f0f0',       // 세그먼트/칩 트랙 배경
  recordingRed: '#EF4444',    // 녹음 라이브 점 한정
  successGreen: '#2e7d32',
  warningAmber: '#e65100',
  dangerRed: '#c62828',

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
  successBg: '#e8f5e9',
  infoBg: '#fff3e0',
  pendingBg: '#f0f0f0',
  dangerBg: '#fce4ec',
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
    fontFamily: 'Pretendard-ExtraBold',
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'Pretendard-Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: 'Pretendard-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  caption: {
    fontFamily: 'Pretendard-Medium',
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
