# Design System — IBK STT

> Stitch 출력물(`stitch_ibk_stt_enterprise_app/`)의 tailwind config과 1:1 매칭.
> 코드 측 단일 진실: `src/theme/tokens.ts` (RN 컴포넌트는 모두 여기서 import).

## Mood

Calm, professional, focused — **IBK 시그니처 블루를 프라이머리로 한 금융 사내앱 톤**. 화이트 기반 미니멀 + 신뢰감. Linear-meets-Apple 골격은 유지하되 브랜드 컬러로 정체성 부여.
워드마크는 **IBK STT** 사용 (Stitch 일부 결과의 "VocalLog"는 무시 — CLAUDE.md 정책).

## Brand (IBK)

- **IBK Blue (#00457C)** = primary. SSO/CTA, 활성 탭, FAB, 강조 헤드라인에 사용.
- 공식 CI hex는 비공개 → 통용 IBK 딥블루 기준. **브랜드 가이드 수령 시 `primary` 한 토큰만 교체**하면 파생 토큰(`primaryDark`/`primaryTint`)이 따라가도록 설계.
- 톤: 절제·신뢰. 블루는 면적을 넓게 쓰지 않고 액션·강조에 집중, 본문은 화이트/그레이 유지.

## Colors

### Light theme

| Token | Hex | 용도 |
| --- | --- | --- |
| `background` | `#FFFFFF` | 화면 배경 |
| `surface` | `#fcf8fa` | 일반 surface |
| `surfaceContainer` | `#f0edee` | 카드/groupé container |
| `surfaceContainerLow` | `#f6f3f4` | 입력 필드/메모 입력 배경 |
| `borderLight` | `#E5E7EB` | 카드/divider 보더 |
| `textPrimary` | `#111827` | 본문 (또는 `#1b1b1d` on-surface) |
| `textSecondary` | `#585f6c` | 보조 텍스트, placeholder |
| `textOnSecondaryContainer` | `#34526b` | 보조 버튼 텍스트 |
| `primary` | `#00457C` | **IBK Blue** — SSO/CTA 버튼, FAB, 활성 강조 |
| `primaryDark` | `#003258` | primary pressed/gradient 하단 |
| `primaryTint` | `#E6F0F8` | 선택/활성 surface, primary 연한 배경 |
| `onPrimary` | `#FFFFFF` | primary 위 텍스트 |
| `secondaryContainer` | `#dce6f3` | 보조 버튼 배경 (블루 그레이) |
| `accentBlue` | `#2E8BD6` | 링크/포커스 ring/진행 강조/waveform (IBK sky) |
| `recordingRed` | `#EF4444` | 녹음 활성 점 (record 라이브 인디케이터 한정) |
| `dangerRed` | `#DC2626` | 파괴적 액션 |
| `successGreen` | `#10B981` | 완료 상태 |
| `warningAmber` | `#F59E0B` | 주의 |

### Dark theme

| Token | Hex |
| --- | --- |
| `background` | `#0B0F19` |
| `surface` | `#111827` |
| `surfaceElevated` | `#1F2937` |
| `borderDark` | `#1F2937` |
| `textPrimary` | `#F9FAFB` |
| `textSecondary` | `#9CA3AF` |
| `primary` | `#3B9AE1` (다크에서 IBK 블루 밝게 보정) |
| `primaryTint` | `#102A3E` (블루 틴트 surface) |
| `accentBlue` | `#5EB0E8` |
| `recordingRed` | `#F87171` |

## Typography (Hanken Grotesk + Pretendard fallback)

iOS는 SF Pro / Pretendard, Android는 Pretendard. 코드 fontFamily는 시스템 기본을 사용하고 weight/size/lineHeight만 토큰으로 잡는다.

| 토큰 | size | weight | lineHeight | letterSpacing |
| --- | --- | --- | --- | --- |
| `display` | 32 | 800 | 1.2 (38) | -0.5 |
| `heading` | 20 | 700 | 1.3 (26) | 0 |
| `body` | 15 | 400 | 1.5 (22) | 0 |
| `label` | 13 | 600 | 1.2 (16) | 0.4 (uppercase tracking) |
| `caption` | 12 | 500 | 1.2 (15) | 0 |

## Spacing (8pt grid — Stitch tailwind 그대로)

| 토큰 | px |
| --- | --- |
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 24 |
| `2xl` | 32 |
| `3xl` | 48 |

## Radius

| 토큰 | px | 용도 |
| --- | --- | --- |
| `sm` | 4 | (default) |
| `md` | 8 | (lg in tailwind) |
| `lg` | 12 | (xl in tailwind) — 카드, 입력 필드, 보조 버튼 |
| `full` | 9999 | SSO 버튼, FAB, chip |

## 컴포넌트 규칙

### Primary CTA (SSO/주요 액션)
- bg: `primary` (#00457C, IBK Blue) — pressed 시 `primaryDark`(#003258) 또는 두 색 세로 그라데이션
- text: `onPrimary` (#fff), heading 토큰
- height 52, radius `full` (pill)
- 방패/자물쇠 아이콘은 leading 위치, gap `sm`(8)

### Secondary button (사번 로그인 등)
- bg: `secondaryContainer` (#dce6f3, 블루 그레이)
- text: `textOnSecondaryContainer` (#34526b)
- height 52, radius `lg` (12)

### Input field
- bg: `surfaceContainerLow` (#f6f3f4)
- border: 없음 (focus 시 `accentBlue` 2px ring)
- height 56, radius `lg` (12), padding-x `lg` (16)
- floating label: 비포커스/빈 값 → 중앙, 포커스/값 있음 → 상단 10px

### Card
- bg: `background` (#fff) on light, `surface` on dark
- border: 1px `borderLight`
- radius `lg`(12) ~ 14, padding `lg`(16)
- 미묘한 shadow (0 1px 2px rgba(0,0,0,0.04))

### Status badge (3-track)
- 녹음 완료 / 업로드 완료: bg #ECFDF5, text #1E8E5A, 체크 아이콘
- 진행 중: bg #E6F0F8, text #00457C, 회전/업로드 아이콘
- 대기: bg #F3F4F6, text #585f6c, 모래시계 아이콘
- 실패: bg #FEF2F2, text #D14343, 경고 아이콘
- **항상 아이콘 + 텍스트 라벨 병기** (가드레일)

### Bottom Tab
- 5 슬롯: Home / Search / [center FAB] / Library / Profile
- 활성: `primary`(IBK Blue) 아이콘 + 라벨, 비활성: gray
- 중앙 FAB: 60px circle, `primary`(#00457C) bg, white mic icon, lifted
- 녹음 **진행 중**일 때만 FAB에 `recordingRed` 라이브 점 오버레이 (record 의미 보존)

## Motion

- 페이지 전환: 250ms ease-out
- Bottom sheet: 300ms spring
- Skeleton shimmer: 1.5s loop
- Haptic: light(탭 전환), medium(녹음 시작/정지), success(업로드 완료)

## Accessibility

- 최소 탭 타깃 44×44pt
- 본문 대비 WCAG AA (4.5:1)
- 상태는 항상 아이콘+텍스트 (색만 X — 가드레일)
- Dynamic Type 대응
