---
name: IBK STT Design System
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e5e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e5e2e3'
  background-light: '#FFFFFF'
  surface-light: '#F9FAFB'
  border-light: '#E5E7EB'
  text-primary-light: '#111827'
  accent-blue: '#2563EB'
  recording-red: '#EF4444'
  success-green: '#10B981'
  warning-amber: '#F59E0B'
  danger-red: '#DC2626'
  background-dark: '#0B0F19'
  surface-dark: '#111827'
  surface-elevated-dark: '#1F2937'
  border-dark: '#1F2937'
  text-primary-dark: '#F9FAFB'
  accent-blue-dark: '#60A5FA'
typography:
  display:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.5px
  heading:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.3'
  body:
    fontFamily: Hanken Grotesk
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.2'
  caption:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
---

# Design System — IBK STT (Stitch DESIGN.md)

> 모든 Stitch 프롬프트가 이 디자인 토큰을 공유.
> Stitch에서 새 프로젝트 만들 때 이 파일을 DESIGN.md로 업로드.

## Mood

Calm, professional, focused. Linear-meets-Apple aesthetic. Korean enterprise context (IBK 사내).

## Colors (Light)

- Background: #FFFFFF
- Surface: #F9FAFB
- Surface elevated: #FFFFFF with shadow
- Border: #E5E7EB
- Text primary: #111827
- Text secondary: #6B7280
- Text tertiary: #9CA3AF
- Primary action: #111827 (near-black)
- Accent (focus / link): #2563EB
- Recording / record dot: #EF4444
- Success: #10B981
- Warning: #F59E0B
- Danger: #DC2626

## Colors (Dark)

- Background: #0B0F19
- Surface: #111827
- Surface elevated: #1F2937
- Border: #1F2937
- Text primary: #F9FAFB
- Text secondary: #9CA3AF
- Primary action: #FFFFFF
- Accent: #60A5FA
- Recording dot: #F87171

Dark mode is first-class — every screen must support it.

## Typography

- Family: SF Pro Text on iOS, Pretendard on Android (Korean-friendly)
- Display (page titles): 32px / 800 weight / -0.5px letter spacing
- Heading (section): 20px / 700 weight
- Body: 15px / 400 weight / 1.5 line-height
- Label: 13px / 600 weight
- Caption: 12px / 500 weight / #6B7280

## Spacing (8pt grid)

xs:4, sm:8, md:12, lg:16, xl:24, 2xl:32, 3xl:48

## Components

- Corner radius: 10px on inputs, 12-14px on cards, 16px on bottom sheets, full pill on chips
- Card: white surface, 1px #E5E7EB border, very subtle shadow (0 1px 2px rgba(0,0,0,0.04))
- Primary button: black bg, white text, 14px radius, 52px height, bold weight
- Secondary button: #F3F4F6 bg, #111827 text
- Input: #F9FAFB bg, 1px #D1D5DB border, focus → #2563EB ring
- Bottom sheet: top corners 16px radius, drag handle, blur scrim
- Status badge: icon + text label (NEVER color-only — accessibility guardrail)
- FAB: 60px circle, brand red #EF4444, microphone or record icon

## Iconography

Outline icons (Lucide / Phosphor). 24px default. Always paired with a label when used as status indicator.

## Motion

- Page transition: 250ms ease-out
- Bottom sheet: 300ms spring
- Skeleton shimmer: 1.5s loop
- Haptic: light impact on tab switch, medium on record start/stop, success on upload complete

## Accessibility

- Minimum tap target: 44x44 pt
- Color contrast WCAG AA (4.5:1 for body text)
- Status colors paired with icons + text labels
- Dynamic type support (scales with system font size)
