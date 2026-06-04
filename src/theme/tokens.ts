// src/theme/tokens.ts
// IBK 컨셉 스킨 v2.0 — app-ibk_v2.0.html :root 오버라이드 기준
import { TextStyle } from 'react-native';

export const colors = {
  // ── IBK v2.0 핵심 토큰 ───────────────────────────
  background:   '#f4f6f9',   // --c-bg
  surface:      '#ffffff',   // --c-surface
  secondary:    '#eef1f6',   // --c-secondary
  border:       '#dde2eb',   // --c-border
  text:         '#0a1628',   // --c-text (진한 네이비)
  primary:      '#005BAC',   // --c-primary / --c-accent (IBK 블루)
  accent:       '#005BAC',   // --c-accent
  accent2:      '#1B72E4',   // --c-accent2
  muted:        '#94a3b8',   // --c-muted

  // ── 상태 색상 ─────────────────────────────────────
  successGreen: '#16a34a',   // --c-done
  warningAmber: '#d97706',   // --c-proc
  dangerRed:    '#dc2626',   // --c-fail

  // ── 배지 배경 ─────────────────────────────────────
  successBg:    '#e8f5e9',
  infoBg:       '#fff3e0',
  pendingBg:    '#eef1f6',
  dangerBg:     '#fce4ec',

  // ── 기타 ──────────────────────────────────────────
  onPrimary:    '#ffffff',
  recordingRed: '#EF4444',   // 녹음 라이브 점 한정
  accentBlue:   '#005BAC',

  // ── 호환 aliases (기존 코드 참조) ─────────────────
  surfaceLight:         '#ffffff',
  borderLight:          '#dde2eb',
  textPrimary:          '#0a1628',
  textSecondary:        '#94a3b8',
  textTertiary:         '#94a3b8',
  onSurface:            '#0a1628',
  onSurfaceVariant:     '#94a3b8',
  trackGray:            '#eef1f6',
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
  xs:   4,
  sm:   8,
  md:   12,   // --r: 12px
  lg:   16,   // --r-lg: 16px
  xl:   20,
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
