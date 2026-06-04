# Stitch UI Prompts — IBK STT

> 화면 1개 = 프롬프트 1개. 영문 그대로 [stitch.withgoogle.com](https://stitch.withgoogle.com)에 붙여넣기.
> DESIGN.md는 `docs/design-system.md` 업로드.

## 디자인 컨셉

| 항목 | 값 |
| --- | --- |
| 플랫폼 | Mobile (iOS/Android) |
| 스타일 | Calm, professional, trustworthy — IBK 시그니처 블루 정제 |
| 컬러 테마 | Light + Dark mode 동급 지원, **Primary = IBK Blue #00457C** |
| 대상 사용자 | IBK 사내 직원 (B2B internal) |
| 주요 사용 맥락 | 회의·인터뷰 음성 녹음 → 전사·검색 |

> **2026-06-01 리프레시**: 프레임워크(BottomTabs+FAB / Bottom Sheet / Swipe / 3-track)는 유지하고 brand 컬러만 IBK 블루로 정제. Stitch 프롬프트의 `near-black` primary → IBK Blue, `red FAB` → IBK Blue(녹음 중에만 red 라이브 점). 정확한 토큰은 `docs/design-system.md` 참조.

## 화면 맵 (12 screens)

```
P0 (필수)
  1. Splash               — 1초 부팅
  2. Login                — SSO + 사번/비번
  3. RecordingList        — Home (Bottom Tabs + FAB)
  4. Recording            — 녹음 중
  5. RecordingDetail      — 단건 상세

P1 (1차 dogfood)
  6. Transcript           — 전사 결과 + 화자 분리
  7. OnboardingCarousel   — 가치 설명 3장
  8. PermissionPrimer     — 권한 설명
  9. BiometricEnroll      — Face ID 등록

P2 (확장)
  10. Search              — 전체 + 본문 검색
  11. Library             — 즐겨찾기/보관/태그
  12. Profile             — 설정/로그아웃
```

---

## Screen 1: Splash

### Stitch Prompt

```
[Product]: A calm professional Korean enterprise mobile app called "IBK STT" for internal employees to record meetings and get speech-to-text transcripts.
[Screen]: Splash screen — shown for 1 second on app launch while session is restored.
[Layout]:
- Top: status bar only
- Center: large bold wordmark "IBK STT" in IBK blue (#00457C), with a small tagline below "회의를 텍스트로" in muted gray
- Bottom-center: subtle activity indicator (small spinner)
[Style]: white background, the "IBK STT" wordmark in IBK blue (#00457C), tagline in muted gray, very minimal, lots of whitespace, no decoration. Trustworthy Korean-enterprise aesthetic.
[Constraints]: Must look identical in light and dark mode (invert colors). Brand-forward but not flashy. WCAG AA contrast.
Device type: Mobile
```

### 수정 가이드
- 로고 자산 도착 후: "Replace the wordmark with the IBK STT logo SVG, keep the tagline below."
- 다크모드 강조: "Add a subtle gradient from #0B0F19 to #111827 in dark mode background."

---

## Screen 2: Login

### Stitch Prompt

```
[Product]: A calm professional mobile app for IBK employees to record meetings and access transcripts.
[Screen]: Login screen — primary entry for unauthenticated users. Two paths: enterprise SSO (primary) and employee-ID/password (fallback).
[Layout]:
- Top (40% from top): brand label "IBK STT" small uppercase, then a large bold heading "로그인" (Login) below it, then a muted subtitle "사내 SSO 계정으로 시작하세요"
- Primary CTA: a large full-width IBK-blue (#00457C) pill button labeled "IBK SSO로 로그인" (52px height, bold white text, optional subtle gradient to #003258)
- Below the button: tiny gray helper text "현재 가상 SSO로 동작합니다. IBK투자증권 SSO 사양 수령 후 자동 전환됩니다."
- Divider with center text "또는 사번으로 로그인"
- Toggle link "사번 로그인 열기" (blue, centered)
- When expanded: two stacked input fields — "사번" (employee ID, numeric) and "비밀번호" (password, masked) — both with #F9FAFB background and floating labels, then a secondary gray button "로그인"
- Bottom: nothing (clean)
[Style]: white background, generous vertical spacing (24-32px between blocks), 14px corner radius on inputs, 12px on the secondary button, IBK-blue (#00457C) primary button. Korean text, Pretendard or SF Pro.
[Constraints]: Keyboard-avoiding layout. Error state shows a red-tinted card below the form with an icon + message. Must work in dark mode.
Device type: Mobile
```

### 수정 가이드
- "Add a 'Face ID로 빠른 로그인' button above the SSO button when biometric is enrolled."
- "Show the password fallback section collapsed by default; expand on toggle tap with a smooth height animation."

---

## Screen 3: RecordingList (Home)

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to capture meeting audio and review transcripts.
[Screen]: Home — list of recordings with filter, sort, and a center-floating FAB to start a new recording. This is the main hub after login.
[Layout]:
- Top: small greeting header "오늘 회의 3건" in gray with the user's first name above it in larger weight
- Below header: a horizontal segmented filter "전체 | 업로드중 | 완료 | 실패" with active state pill. Right of it: a small sort chip "최신순 ↕"
- Main: vertical scroll list of recording cards. Each card shows — title (bold, single line ellipsized), date & duration in muted text, and a row of 3 small status badges labeled "녹음" "업로드" "전사" each with an icon AND a text status (e.g. "완료" "진행 70%" "대기"). Cards are white with subtle 1px border, 14px radius, 16px padding, swipeable left for archive, right for delete (reveal action under card with colored background).
- Empty state: centered illustration of a microphone with text "첫 녹음을 시작해보세요" and a subtle prompt to tap the FAB
- Bottom: a fixed bottom tab bar with 5 slots — Home (filled, IBK blue), Search, [center large record FAB], Library, Profile. The center FAB is circular, 60px, IBK blue #00457C, white microphone icon, lifted above the bar with a shadow. The active tab uses IBK blue, inactive tabs are gray.
[Style]: warm minimal, lots of whitespace, status badges always pair icon + label (never color-only), light shadows. 8pt spacing grid.
[Constraints]: Pull-to-refresh on the list. Dark mode supported. One-handed reach for the FAB.
Device type: Mobile
```

### 수정 가이드
- "Replace the sort chip with a filter icon button that opens a bottom sheet with sort and date-range options."
- "On long-press of a card, enter multi-select mode: cards get a checkbox, and a contextual bottom action bar appears with Archive / Delete / Tag."
- "Add a sticky 'today' section header that appears when scrolling past today's recordings."

---

## Screen 4: Recording (active)

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to capture meeting audio.
[Screen]: Active recording screen — entered via the center FAB. User can pause, resume, stop, and add a quick note while recording. This is a focused, distraction-free screen.
[Layout]:
- Top: minimal header with a small "X" close icon (asks confirmation) on the left and a "00:12:34" timer in a large monospaced font centered
- Upper-middle: large animated waveform visualization, full width, soft amplitude bars in IBK sky blue (#2E8BD6), animating in real time
- Middle: a small dB level meter underneath the waveform with a numeric value and a label "입력 레벨"
- Lower-middle: a single-line "빠른 메모" text input with placeholder "녹음 중 메모하기..." and a subtle border
- Bottom (fixed): two big circular buttons centered — left is a pause button (gray circle, white pause icon), right is a large stop button (red circle, white square icon, 80px diameter, dominant). Below them, small text "탭하여 정지"
[Style]: focused, minimal, generous whitespace. The waveform is the visual anchor. Dark mode preferred for low-light meeting rooms but support both.
[Constraints]: Haptic feedback on pause/stop. Must remain responsive while audio is being recorded in the background. No accidental dismissal.
Device type: Mobile
```

### 수정 가이드
- "Replace the simple waveform with a circular pulsing radial visualization centered on the screen."
- "Add a 'speakers detected: 2' chip below the timer to hint at speaker diarization."

---

## Screen 5: RecordingDetail

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to manage recordings and access transcripts.
[Screen]: Recording detail — single recording's status, actions, memo, and entry point to its transcript.
[Layout]:
- Top: a back chevron, the recording title (large, bold, inline-editable on tap), date and duration in muted text below
- Status section: three horizontal "track rows" stacked vertically — "녹음 상태" / "업로드 상태" / "전사 상태", each with an icon, a label, current status text, and (when in progress) a thin progress bar to the right
- Action group (only the relevant ones visible): "업로드 재시도" (red outline button, only shown if upload failed), "전사 재시도" (amber outline button, only if transcription failed), "전사 요청" (primary IBK-blue #00457C filled button, only if uploaded but not yet requested) — these three are visually DISTINCT and never merged
- Player: a slim audio player bar with play/pause, a scrub bar showing current/total time
- Memo: a multiline expandable text area with placeholder "메모 추가..." that auto-saves
- Primary CTA: a full-width IBK-blue (#00457C) button "전사 결과 보기" (only enabled when transcription completed)
- Bottom: a horizontal share/export icon row (share, export TXT, more — opens bottom sheet)
- Danger zone: small at the very bottom — "삭제" link in muted red, opens a bottom sheet with confirm
[Style]: card-like sections separated by 16-20px gaps, clear hierarchy, status icons always paired with text labels. Avoid using color alone for status.
[Constraints]: Three states (recording / upload / transcription) are NEVER merged into one badge. Action buttons are NEVER combined (retry-upload and retry-transcription must stay distinct). Inline edit on title with debounced save.
Device type: Mobile
```

### 수정 가이드
- "Add a small AI summary preview card under the player when transcription is complete."
- "Convert the danger zone link into a slide-up bottom sheet titled '위험 작업' containing Delete, Archive, Re-process options."

---

## Screen 6: Transcript

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to read and edit speech-to-text transcripts.
[Screen]: Transcript view — speaker-segmented transcript synced with audio playback, searchable, exportable.
[Layout]:
- Top: back chevron, title (recording name, ellipsized), and on the right two icon buttons — search (magnifier) and more (kebab → opens export sheet)
- Below header: a thin sticky row with two toggle chips "화자 표시 ON" and "타임스탬프 ON", and a small "AI 요약" pill that expands a summary card when tapped
- Main: a scrollable transcript list. Each segment is a row containing — a small speaker label chip on the left ("S1", "S2", color-coded but always with the label), a timestamp like "01:23", and the text on the right. Tapping a segment scrubs the audio player to that timestamp and highlights the row.
- Floating: a thin player bar pinned to the bottom showing play/pause, scrubber, time, and a 1x speed pill
- Long press on a segment: a contextual sheet with Highlight (yellow), Bookmark, Copy, Edit
[Style]: comfortable reading line-height (1.6), clear segment separation with subtle dividers, speakers visually distinct but accessible (icon + label, not color only). Dark mode is excellent for long reading.
[Constraints]: Virtualized list for long transcripts. Search opens an in-page search bar with prev/next jump. Edit mode toggle must be explicit.
Device type: Mobile
```

### 수정 가이드
- "Add a left-edge scrubber rail that highlights as the user scrolls, mirroring the audio playhead position."
- "When 'AI 요약' is expanded, show three sub-sections: 핵심 요약, 액션 아이템, 키워드 — each as a small card."

---

## Screen 7: OnboardingCarousel

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to record meetings and get transcripts.
[Screen]: First-launch onboarding — three swipeable slides explaining the value, with a Skip option.
[Layout]:
- Top-right: small "건너뛰기" (Skip) text button in muted gray
- Center: a large minimal illustration (slide 1: microphone with sound waves; slide 2: a document with highlighted text; slide 3: a search bar with results), 60% of viewport vertically
- Below illustration: a bold short title (e.g. "오프라인에서도 녹음", "자동으로 텍스트로", "한 번에 검색") and a single sentence of body copy below it
- Page indicators: 3 dots, centered, active dot wider
- Bottom: a full-width IBK-blue (#00457C) "다음" button on slides 1-2, "시작하기" on slide 3
[Style]: airy, lots of whitespace, friendly but professional illustrations in monochrome line style. No emojis. Korean copy.
[Constraints]: Swipe left/right to navigate. Skip dismisses to permission primer. Must look identical in dark mode (invert background and illustration strokes).
Device type: Mobile
```

### 수정 가이드
- "Add a soft fade transition between slides instead of horizontal swipe."
- "Replace the line illustrations with subtle Lottie animations."

---

## Screen 8: PermissionPrimer

### Stitch Prompt

```
[Product]: A mobile app for recording meeting audio.
[Screen]: Permission primer — explains WHY microphone and notification permissions are needed BEFORE the OS prompt is shown. Shown once after onboarding.
[Layout]:
- Top: a back chevron (left)
- Hero: a clean monochrome icon (a microphone with a soft glow), 80px, centered with 32px top margin
- Below icon: a bold heading "녹음을 시작하려면 마이크 권한이 필요해요" (left-aligned)
- Below heading: a paragraph of body text explaining what the app does with the audio (stays on device until you upload, never shared without your action)
- Two informational rows below the paragraph, each with a small icon and a one-line bullet — "회의 음성을 정확하게 캡처합니다" and "오프라인에서도 녹음 가능합니다"
- Bottom: a full-width IBK-blue (#00457C) primary button "권한 요청하기" and a tertiary text button below it "나중에" in muted gray
[Style]: warm, reassuring, transparent. No alarmism. Generous spacing. Korean copy.
[Constraints]: Tapping "나중에" returns to the previous screen without triggering OS prompt. Must NOT auto-dismiss. WCAG AA.
Device type: Mobile
```

### 수정 가이드
- "Add a second screen variant for notification permission, same layout, with a bell icon and copy explaining upload-complete alerts."
- "When permission is denied at the OS level, show a follow-up bottom sheet linking to system settings."

---

## Screen 9: BiometricEnroll

### Stitch Prompt

```
[Product]: A mobile app for IBK employees, with biometric quick-unlock.
[Screen]: Biometric enrollment — shown once right after first successful login. Offers Face ID or fingerprint quick-unlock.
[Layout]:
- Top-right: "건너뛰기" (Skip) text button in muted gray
- Hero: a large monochrome icon — a stylized face outline (or fingerprint, depending on device capability), 96px, centered with 48px top margin
- Below icon: a bold heading "Face ID로 빠르게 로그인" (or "지문으로 빠르게 로그인")
- Below heading: short body text explaining that biometric data never leaves the device and is only used to unlock the app session
- One reassurance row with a small lock icon and text "사내 보안 정책 준수"
- Bottom: a full-width IBK-blue (#00457C) button "사용하기" and a smaller tertiary "지금은 안 함" below it
[Style]: clean, trust-building, minimal. Korean copy.
[Constraints]: Skipping is allowed and does not block access. The OS biometric prompt is triggered by tapping "사용하기". Dark mode supported.
Device type: Mobile
```

### 수정 가이드
- "Replace the static face icon with a subtle scanning animation that loops once on entry."
- "Show a success state with a green checkmark and 'Face ID 등록 완료' message after enrollment, auto-dismissing after 1.5 seconds."

---

## Screen 10: Search

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to search across recording titles, memos, and full transcript text.
[Screen]: Search — autofocus search bar, recent queries, and tabbed results.
[Layout]:
- Top: a sticky search bar with magnifier icon, autofocus on entry, placeholder "녹음, 본문, 메모 검색...", a small voice search mic on the right, and a "취소" text button on the far right
- Below search bar (when query is empty): a "최근 검색" label and a horizontally-wrapped chip cluster of recent queries (each with a tiny X to remove)
- Below recent (when query is empty): a "추천" section with 3-4 example chips ("어제", "이번 주 회의", "투자전략 회의")
- When results: three segmented tabs "전체 | 제목 | 본문" right under the search bar, with result count badges
- Result list: each row has the recording title, date, and a snippet showing the matched text with the search term highlighted in yellow background, plus a small timestamp chip if it's a transcript hit (tapping jumps to that timestamp)
- Empty results: centered illustration + "검색 결과가 없어요" + a tip text
[Style]: search-bar dominant at top, content density medium, highlighted snippets are scannable. Korean copy.
[Constraints]: Debounced search (300ms). Long results are virtualized. Voice search opens a separate sheet. Dark mode supported.
Device type: Mobile
```

### 수정 가이드
- "Add filter chips below the segmented tabs for date range and tag, opening bottom sheets when tapped."
- "Show a 'AI 요약 검색' badge on results where the match is from the AI summary, not raw transcript."

---

## Screen 11: Library

### Stitch Prompt

```
[Product]: A mobile app for IBK employees to organize recordings.
[Screen]: Library — sectioned view of favorites, archived, and tag-grouped recordings.
[Layout]:
- Top: page title "라이브러리" (large bold) and a small "+" icon button on the right (creates new tag)
- Below title: three horizontal pill tabs "즐겨찾기 | 보관함 | 태그"
- Main (Favorites tab): list of recordings, same card style as Home but with a small star icon top-right
- Main (Archive tab): same list style, archived recordings with a muted background tint and a small archive icon
- Main (Tags tab): a vertical list of tag groups, each as a section header with the tag name and count (e.g. "투자전략 (12)"), expandable to show the recordings under it. Section headers are sticky on scroll.
- Long-press on any tag header: bottom sheet with Rename / Delete / Color
- Bottom: standard bottom tab bar (Library tab active)
[Style]: organized but not cluttered, generous section spacing, tag colors used as accents (small dot before tag name, never as the only signal — also use the label).
[Constraints]: Sticky section headers in tag view. Empty states for each tab. Dark mode supported.
Device type: Mobile
```

### 수정 가이드
- "Convert the Tags tab from a flat list to a 2-column grid of tag cards, each showing tag name and recording count."
- "Add a search field at the top of the Library that filters within the active tab."

---

## Screen 12: Profile

### Stitch Prompt

```
[Product]: A mobile app for IBK employees, internal use.
[Screen]: Profile / Settings — user info, security, sync, notifications, data, legal, logout.
[Layout]:
- Top: a centered large circular avatar (initials placeholder if no photo), the user's name "김레오" below in bold, then "디지털혁신본부 · 사번 00001" in muted text
- Below profile block: a grouped settings list (iOS-style) with sections separated by spacers and section labels:
  - 보안: "Face ID 잠금" (toggle), "자동 잠금 시간" (right-arrow row)
  - 동기화: "Wi-Fi에서만 업로드" (toggle), "백그라운드 업로드" (toggle)
  - 알림: "푸시 알림" (toggle), "전사 완료 알림" (toggle)
  - 데이터: "보관 정책" (right-arrow), "캐시 비우기" (right-arrow with size text "12.4 MB")
  - 법적 고지: "이용 약관", "개인정보 처리방침"
- Bottom: a single-line full-width "로그아웃" button in muted red text on a light red tinted card, opens a bottom sheet for confirmation
- Footer: app version "v0.1.0" centered in tiny gray text
[Style]: settings-app aesthetic, grouped rounded cards (16px radius), 14px row height, clear chevrons on navigable rows, switches use system tinting.
[Constraints]: Toggles have clear labels. The logout confirmation is a bottom sheet, not an alert. Dark mode supported.
Device type: Mobile
```

### 수정 가이드
- "Add a section at the top labeled '내 활동' with three small KPI tiles: 총 녹음 시간 / 전사 완료 / 이번 주 녹음 수."
- "Convert the cache row into an inline progress component that shows a clearing animation when tapped."

---

## 워크플로우

1. Stitch에 새 프로젝트 생성 → `docs/design-system.md`를 DESIGN.md로 업로드
2. 위 12개 프롬프트 중 하나를 복사해서 새 화면 생성
3. 결과가 마음에 안 들면 같은 프롬프트의 "수정 가이드" 항목을 "한 번에 하나씩" 적용
4. 화면 PNG와 HTML export → `feature-build-team` 또는 `leo-spec`으로 넘겨 React Native 컴포넌트화

## 다음 액션 후보

- Phase 2: Stitch SDK 자동화로 12개 한 번에 generate (`@google/stitch-sdk` 도입 시)
- Figma 동기화: Stitch HTML → Figma 컴포넌트 import
