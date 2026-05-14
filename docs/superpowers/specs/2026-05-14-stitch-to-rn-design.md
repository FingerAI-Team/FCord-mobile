# IBK STT — Stitch → React Native 변환 설계

**날짜:** 2026-05-14  
**접근법:** UI 레이어 교체 (기존 비즈니스 로직 보존, StyleSheet + JSX를 Stitch 디자인으로 교체)  
**플랫폼:** iOS + Android (cross-platform)

---

## 1. 범위 요약

| 카테고리 | 수량 | 내용 |
|---|---|---|
| 디자인 시스템 업데이트 | 1 | `theme/tokens.ts` 전면 교체 |
| 기존 화면 UI 교체 | 8 | 로직 보존, JSX/StyleSheet 재작성 |
| 신규 화면 추가 | 5 | Stitch에 있지만 RN에 없는 화면 |
| 네비게이션 업데이트 | 1 | AuthStack 온보딩 플로우 + Transcript 연결 |
| 폰트 번들링 | 1 | Hanken Grotesk iOS/Android 추가 |

---

## 2. 디자인 시스템 (`theme/tokens.ts`)

### 변경 사항
기존 `tokens.ts`를 Stitch `DESIGN.md`의 전체 사양으로 교체한다.

### 컬러 팔레트
Material Design 3 기반 전체 팔레트 (light/dark 모두 포함):

```
surface / surface-dim / surface-bright
surface-container-lowest ~ surface-container-highest
on-surface / on-surface-variant
primary / on-primary / primary-container / on-primary-container
secondary / on-secondary / secondary-container / on-secondary-container
tertiary / on-tertiary / tertiary-container / on-tertiary-container
error / on-error / error-container / on-error-container
primary-fixed ~ on-primary-fixed-variant (고정 컬러 6종)
secondary-fixed ~ on-secondary-fixed-variant (고정 컬러 4종)
tertiary-fixed ~ on-tertiary-fixed-variant (고정 컬러 4종)
background / on-background
outline / outline-variant
surface-tint / inverse-surface / inverse-on-surface / inverse-primary
# 앱 고유 컬러
recording-red: #EF4444
accent-blue: #2563EB / accent-blue-dark: #60A5FA
success-green: #10B981
warning-amber: #F59E0B
danger-red: #DC2626
# 다크모드 서피스
background-dark: #0B0F19 / surface-dark: #111827 / surface-elevated-dark: #1F2937
border-dark: #1F2937 / text-primary-dark: #F9FAFB
```

### 타이포그래피 (5 레벨)
| 레벨 | fontSize | fontWeight | lineHeight |
|---|---|---|---|
| display | 32 | 800 | 38 |
| heading | 20 | 700 | 26 |
| body | 15 | 400 | 22 |
| label | 13 | 600 | 16 |
| caption | 12 | 500 | 14 |

폰트 패밀리: `HankenGrotesk` (번들 파일: `HankenGrotesk-Regular/Medium/SemiBold/Bold/ExtraBold`)

### 스페이싱
`xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 2xl: 32, 3xl: 48`

### 보더 라디우스
`xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999`

---

## 3. 폰트 번들링

### 작업
1. `assets/fonts/` 디렉토리에 Hanken Grotesk TTF 5종 추가
   - `HankenGrotesk-Regular.ttf`
   - `HankenGrotesk-Medium.ttf`
   - `HankenGrotesk-SemiBold.ttf`
   - `HankenGrotesk-Bold.ttf`
   - `HankenGrotesk-ExtraBold.ttf`
2. `react-native.config.js` 추가 (폰트 assets 경로 링크)
3. `npx react-native-asset` 또는 수동 링크로 iOS/Android에 폰트 등록
4. iOS: `Info.plist`에 `UIAppFonts` 배열 추가
5. Android: `android/app/src/main/assets/fonts/` 복사

---

## 4. 기존 화면 UI 교체 (8개)

각 화면은 **기존 store 연결/이벤트 핸들러를 그대로 유지**하고, JSX 구조와 StyleSheet만 Stitch 디자인으로 교체한다.

### 4-1. RecordingListScreen (`home_screen`)
**파일:** `src/features/recordings/recordingListScreen.tsx`

주요 변경:
- 상단에 인사말 섹션 추가 ("오늘 회의 N건 / {이름} 님")
- 필터 칩을 pill 형태 container로 교체 (`surface-container-low` 배경)
- RecordingCard 스타일을 Stitch `recording-card` 패턴으로 업데이트
- 빈 상태 UI 개선

### 4-2. RecordingDetailScreen (`recording_detail_screen`)
**파일:** `src/features/recordings/recordingDetailScreen.tsx`

주요 변경:
- 오디오 플레이어 UI (프로그레스바, 재생 컨트롤) 재디자인
- 상태 배지를 Stitch 스타일로 교체
- 메타데이터 섹션 (날짜, 길이, 태그) 레이아웃 정렬
- 재전송/재처리 버튼 스타일

### 4-3. RecordingScreen (`active_recording_screen`)
**파일:** `src/features/recording-session/RecordingScreen.tsx`

주요 변경:
- 웨이브폼 시각화 영역 (현재 없음 → animated bars 추가)
- 타이머 디스플레이 (display 타이포그래피)
- 일시정지/재개/정지 버튼 레이아웃
- 제목 입력 인라인 편집 UI

### 4-4. SearchScreen (`search_screen`)
**파일:** `src/features/search/SearchScreen.tsx`

주요 변경:
- 검색창 스타일 (rounded-full, surface-container)
- 최근 검색어 칩 섹션
- 결과 텍스트 하이라이팅 (mark 스타일)
- 빈 상태 일러스트레이션 영역

### 4-5. LibraryScreen (`library_screen`)
**파일:** `src/features/library/LibraryScreen.tsx`

주요 변경:
- 즐겨찾기/보관함/태그 섹션 헤더 스타일
- 태그 칩 목록 레이아웃
- 빈 상태 UI

### 4-6. LoginScreen (`login_screen`)
**파일:** `src/features/auth/loginScreen.tsx`

주요 변경:
- IBK 로고 + 앱명 헤더 영역
- 입력 필드 (outline 스타일, label 애니메이션 불필요)
- Primary CTA 버튼 (full-width, rounded-xl)
- 약관 동의 체크박스 (pre-check 금지 가드레일 준수)

### 4-7. SplashScreen (`splash_screen`)
**파일:** `src/features/auth/splashScreen.tsx`

주요 변경:
- 브랜드 컬러 배경 (`primary-container`)
- IBK STT 로고 + 버전 표시
- 로딩 인디케이터

### 4-8. ProfileScreen (`profile_settings_screen`)
**파일:** `src/features/profile/ProfileScreen.tsx`

주요 변경:
- 아바타 원형 + 이름/이메일 헤더
- 설정 섹션 리스트 (chevron 아이콘 포함)
- 로그아웃 버튼 (danger-red)

---

## 5. 신규 화면 추가 (5개)

### 5-1. TranscriptScreen (`transcript_view_screen`)
**파일:** `src/features/transcript/TranscriptScreen.tsx` (신규)

기능:
- 원문/편집본 탭 전환
- Segment 리스트 (화자 레이블, 타임스탬프, 텍스트)
- 인라인 편집 (TextInput으로 전환)
- 저장 버튼 (편집 모드)

스토어: `src/stores/transcriptStore.ts` 신규 생성 (recordingId 키, segments 배열, editMode, pendingEdits 관리)

### 5-2. OnboardingScreen (`onboarding_slide_1/2/3`)
**파일:** `src/features/onboarding/OnboardingScreen.tsx` (신규)

기능:
- 3페이지 스와이프 (FlatList 또는 ScrollView pagingEnabled)
- 각 슬라이드: 일러스트 + 타이틀 + 설명
- 하단 dot indicator
- "다음" / "시작하기" 버튼
- 최초 실행 여부 플래그 (`@react-native-async-storage/async-storage` 패키지, 키: `@ibk_stt:onboarded`)

### 5-3. PermissionPrimerScreen (`permission_primer_screen`)
**파일:** `src/features/onboarding/PermissionPrimerScreen.tsx` (신규)

기능:
- 마이크 권한 필요성 설명 카드
- 알림 권한 설명 카드 (선택)
- "허용하기" 버튼 → 실제 권한 요청 (react-native-permissions)
- "나중에" 버튼 → 로그인으로 스킵 가능 (단, 녹음 불가 경고 표시)

### 5-4. BiometricEnrollmentScreen (`biometric_enrollment_screen`)
**파일:** `src/features/auth/BiometricEnrollmentScreen.tsx` (신규)

기능:
- 생체인증(Face ID/Touch ID/지문) 등록 안내
- "등록하기" 버튼 → react-native-keychain biometrics API
- "나중에" 버튼 → 스킵 가능

---

## 6. 네비게이션 업데이트

### AuthStack 변경
```
현재:  Splash → Login
변경:  Splash → Onboarding (최초 실행 시) → PermissionPrimer → BiometricEnrollment → Login
       Splash → Login (재실행 시, onboarded 플래그 확인)
```

**파일:** `src/navigation/AuthStack.tsx`

온보딩 플래그 로직:
- `Splash`에서 `AsyncStorage.getItem('@ibk_stt:onboarded')` 확인
- null → Onboarding 플로우
- 'true' → Login 바로 이동

### MainStack 변경
```
현재:  Transcript → TranscriptPlaceholder (null 반환)
변경:  Transcript → TranscriptScreen (실제 구현)
```

**파일:** `src/navigation/MainStack.tsx`  
**변경:** `TranscriptPlaceholder` 제거, `TranscriptScreen` import 및 연결

### 타입 업데이트
**파일:** `src/navigation/types.ts`
- `AuthStackParamList`에 `Onboarding`, `PermissionPrimer`, `BiometricEnrollment` 추가
- `MainStackParamList`의 `Transcript` 파라미터 타입 확정 (`{ recordingId: string }`)

---

## 7. 제약 및 가드레일

- `약관 동의 pre-check 금지` (LoginScreen 체크박스)
- `사용자 명시 액션 없이 녹음 자동 시작 금지` (RecordingScreen)
- `색만으로 상태 표시 금지` — 모든 상태 배지에 텍스트 라벨 병기
- `토큰 평문 저장 금지` — BiometricEnrollment에서 Keychain API만 사용

---

## 8. 구현 순서

1. 폰트 번들링 + `tokens.ts` 업데이트 (기반 작업)
2. 신규 화면 추가 (Transcript, Onboarding, Permission, Biometric)
3. 네비게이션 업데이트
4. 기존 화면 UI 교체 (Home → Detail → Recording → Search → Library → Login → Splash → Profile 순)
5. 전체 통합 검증
