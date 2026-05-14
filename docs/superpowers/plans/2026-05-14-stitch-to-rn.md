# IBK STT — Stitch → React Native 변환 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stitch HTML 디자인 15개를 React Native 코드로 변환하고, 신규 화면 5개(Transcript/Onboarding/Permission/Biometric/Landing)를 추가해 iOS·Android 양 플랫폼에서 동작하는 완성된 앱 UI를 만든다.

**Architecture:** 기존 비즈니스 로직(stores, API, upload queue)은 보존하고, JSX 구조와 StyleSheet만 Stitch 디자인으로 교체한다. Hanken Grotesk 폰트를 번들링하고 `tokens.ts`를 단일 진실로 삼아 모든 화면이 참조한다.

**Tech Stack:** React Native 0.75.3, TypeScript, Zustand, @react-navigation/native v7, @react-native-async-storage/async-storage, react-native-permissions, react-native-keychain

---

## 파일 구조 (변경 대상 전체)

**신규 생성:**
- `react-native.config.js` — 폰트 assets 경로 선언
- `assets/fonts/HankenGrotesk-{Regular,Medium,SemiBold,Bold,ExtraBold}.ttf` — 번들 폰트 5종
- `src/stores/transcriptStore.ts` — 전사 뷰/편집 상태
- `src/features/transcript/TranscriptScreen.tsx` — 전사 결과 화면
- `src/features/onboarding/OnboardingScreen.tsx` — 온보딩 3슬라이드
- `src/features/onboarding/PermissionPrimerScreen.tsx` — 권한 설명 화면
- `src/features/auth/BiometricEnrollmentScreen.tsx` — 생체인증 등록 화면
- `src/navigation/LandingScreen.tsx` — 온보딩 플래그 체크 → 분기
- `__tests__/transcriptStore.test.ts`

**수정:**
- `package.json` — @react-native-async-storage/async-storage 추가
- `src/theme/tokens.ts` — Hanken Grotesk + 전체 컬러 팔레트
- `src/navigation/types.ts` — AuthStack 신규 화면 타입
- `src/navigation/AuthStack.tsx` — Landing → Onboarding → Permission → Biometric → Login 플로우
- `src/navigation/AuthGate.tsx` — booting 시 branded SplashScreen 렌더
- `src/navigation/MainStack.tsx` — TranscriptPlaceholder → TranscriptScreen
- `src/features/auth/splashScreen.tsx` — Stitch 디자인 적용
- `src/features/auth/loginScreen.tsx` — tokens 업데이트 (Hanken Grotesk)
- `src/features/recordings/recordingListScreen.tsx` — 인사말 헤더 + 카드 재디자인
- `src/features/recordings/recordingCard.tsx` — Stitch 카드 스타일
- `src/features/recordings/statusBadge.tsx` — 보더 + 아이콘 추가
- `src/features/recordings/recordingDetailScreen.tsx` — 상태 카드 + 오디오 플레이어
- `src/features/recording-session/RecordingScreen.tsx` — Stitch 레이아웃 polish
- `src/features/search/SearchScreen.tsx` — 최근 검색어 칩 + 결과 카드
- `src/features/library/LibraryScreen.tsx` — 섹션 탭 + 태그 그룹
- `src/features/profile/ProfileScreen.tsx` — 아바타 헤더 + 설정 리스트

---

## Task 1: AsyncStorage 패키지 추가

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/leokim/workspace/ibk_stt
npm install @react-native-async-storage/async-storage
```

Expected: `node_modules/@react-native-async-storage/async-storage` 생성됨

- [ ] **Step 2: iOS pod 설치**

```bash
cd ios && pod install && cd ..
```

Expected: `Pods/RNCAsyncStorage` 포함

- [ ] **Step 3: 커밋**

```bash
git add package.json package-lock.json ios/Podfile.lock
git commit -m "feat: @react-native-async-storage/async-storage 추가"
```

---

## Task 2: Hanken Grotesk 폰트 번들링

**Files:**
- Create: `assets/fonts/` (TTF 5종)
- Create: `react-native.config.js`
- Modify: `android/app/src/main/assets/fonts/` (복사)
- Modify: `ios/IbkStt/Info.plist` (UIAppFonts 추가)

- [ ] **Step 1: fonts 디렉토리 생성 및 TTF 다운로드**

Google Fonts에서 Hanken Grotesk를 다운로드한다 (https://fonts.google.com/specimen/Hanken+Grotesk).
다운로드한 zip에서 다음 5개 파일을 `assets/fonts/`에 복사한다:

```
HankenGrotesk-Regular.ttf
HankenGrotesk-Medium.ttf
HankenGrotesk-SemiBold.ttf
HankenGrotesk-Bold.ttf
HankenGrotesk-ExtraBold.ttf
```

```bash
mkdir -p assets/fonts
ls assets/fonts/
```

Expected: 5개 TTF 파일 목록 출력

- [ ] **Step 2: react-native.config.js 생성**

```js
// react-native.config.js
module.exports = {
  assets: ['./assets/fonts/'],
};
```

- [ ] **Step 3: Android — fonts 복사**

```bash
mkdir -p android/app/src/main/assets/fonts
cp assets/fonts/*.ttf android/app/src/main/assets/fonts/
ls android/app/src/main/assets/fonts/
```

Expected: 5개 TTF 파일

- [ ] **Step 4: iOS — Info.plist에 UIAppFonts 추가**

`ios/IbkStt/Info.plist`를 열어 `<dict>` 내에 다음을 추가한다:

```xml
<key>UIAppFonts</key>
<array>
  <string>HankenGrotesk-Regular.ttf</string>
  <string>HankenGrotesk-Medium.ttf</string>
  <string>HankenGrotesk-SemiBold.ttf</string>
  <string>HankenGrotesk-Bold.ttf</string>
  <string>HankenGrotesk-ExtraBold.ttf</string>
</array>
```

- [ ] **Step 5: iOS — Xcode 프로젝트에 폰트 파일 추가**

```bash
# Xcode에서 ios/IbkStt.xcworkspace를 열고:
# 1. 프로젝트 네비게이터에서 IbkStt 폴더 우클릭 → "Add Files to IbkStt..."
# 2. assets/fonts/ 폴더를 선택, "Copy items if needed" 체크
# 3. Target: IbkStt 체크 후 Add
```

- [ ] **Step 6: 빌드 확인 (iOS)**

```bash
npx react-native run-ios --simulator "iPhone 15"
```

Expected: 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add assets/fonts/ react-native.config.js android/app/src/main/assets/fonts/ ios/IbkStt/Info.plist ios/IbkStt.xcodeproj/
git commit -m "feat: Hanken Grotesk 폰트 번들링 (iOS/Android)"
```

---

## Task 3: tokens.ts — 전체 디자인 시스템 업데이트

**Files:**
- Modify: `src/theme/tokens.ts`

- [ ] **Step 1: tokens.ts 전체 교체**

```typescript
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
  onPrimaryFixed_compat: '#141b2b', // alias
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

// 각 weight는 개별 PostScript 이름으로 지정 — iOS/Android 동일 동작 보장
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
```

- [ ] **Step 2: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없거나 기존 에러만 (tokens 관련 신규 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/theme/tokens.ts
git commit -m "feat: tokens.ts — Hanken Grotesk + 전체 Material3 컬러 팔레트"
```

---

## Task 4: transcriptStore.ts + 테스트

**Files:**
- Create: `src/stores/transcriptStore.ts`
- Create: `__tests__/transcriptStore.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```typescript
// __tests__/transcriptStore.test.ts
import { act } from 'react';
import { useTranscriptStore } from '../src/stores/transcriptStore';

describe('transcriptStore', () => {
  beforeEach(() => {
    useTranscriptStore.getState().reset();
  });

  it('초기 상태는 빈 segments, editMode false', () => {
    const s = useTranscriptStore.getState();
    expect(s.recordingId).toBeNull();
    expect(s.segments).toEqual([]);
    expect(s.editMode).toBe(false);
    expect(s.pendingEdits).toEqual({});
  });

  it('toggleEditMode가 editMode를 반전시킨다', () => {
    act(() => useTranscriptStore.getState().toggleEditMode());
    expect(useTranscriptStore.getState().editMode).toBe(true);
    act(() => useTranscriptStore.getState().toggleEditMode());
    expect(useTranscriptStore.getState().editMode).toBe(false);
  });

  it('editSegment가 pendingEdits에 변경 내용을 저장한다', () => {
    act(() => useTranscriptStore.getState().editSegment('seg-1', '수정된 텍스트'));
    expect(useTranscriptStore.getState().pendingEdits['seg-1']).toBe('수정된 텍스트');
  });

  it('reset이 상태를 초기화한다', () => {
    act(() => {
      useTranscriptStore.getState().editSegment('seg-1', '텍스트');
      useTranscriptStore.getState().toggleEditMode();
    });
    act(() => useTranscriptStore.getState().reset());
    const s = useTranscriptStore.getState();
    expect(s.pendingEdits).toEqual({});
    expect(s.editMode).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npm test -- --testPathPattern=transcriptStore 2>&1 | tail -20
```

Expected: FAIL — `Cannot find module '../src/stores/transcriptStore'`

- [ ] **Step 3: transcriptStore.ts 구현**

```typescript
// src/stores/transcriptStore.ts
import { create } from 'zustand';
import { TranscriptSegment } from '../types';
import { getTranscript, saveTranscriptEdits } from '../api/recordings';

interface TranscriptState {
  recordingId: string | null;
  segments: (TranscriptSegment & { id: string })[]; // id = index 기반
  editMode: boolean;
  pendingEdits: Record<string, string>; // segmentId → 편집 텍스트
  isLoading: boolean;
  error: string | null;

  loadTranscript: (recordingId: string) => Promise<void>;
  toggleEditMode: () => void;
  editSegment: (segmentId: string, text: string) => void;
  saveEdits: () => Promise<void>;
  reset: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  recordingId: null,
  segments: [],
  editMode: false,
  pendingEdits: {},
  isLoading: false,
  error: null,

  loadTranscript: async (recordingId) => {
    set({ isLoading: true, error: null, recordingId });
    try {
      const raw = await getTranscript(recordingId);
      const segments = raw.map((seg, i) => ({ ...seg, id: `seg-${i}` }));
      set({ segments, isLoading: false });
    } catch {
      set({ error: '전사 결과를 불러오지 못했습니다', isLoading: false });
    }
  },

  toggleEditMode: () =>
    set((s) => ({ editMode: !s.editMode })),

  editSegment: (segmentId, text) =>
    set((s) => ({
      pendingEdits: { ...s.pendingEdits, [segmentId]: text },
    })),

  saveEdits: async () => {
    const { recordingId, segments, pendingEdits } = get();
    if (!recordingId || Object.keys(pendingEdits).length === 0) return;
    const updated = segments.map((seg) =>
      pendingEdits[seg.id] !== undefined
        ? { ...seg, text: pendingEdits[seg.id] }
        : seg
    );
    set({ isLoading: true });
    try {
      await saveTranscriptEdits(recordingId, updated);
      set({ segments: updated, pendingEdits: {}, editMode: false, isLoading: false });
    } catch {
      set({ error: '저장에 실패했습니다', isLoading: false });
    }
  },

  reset: () =>
    set({
      recordingId: null,
      segments: [],
      editMode: false,
      pendingEdits: {},
      isLoading: false,
      error: null,
    }),
}));
```

- [ ] **Step 4: `getTranscript` / `saveTranscriptEdits` API 함수 추가**

`src/api/recordings.ts` 끝에 추가:

```typescript
// 전사 결과 조회
export async function getTranscript(
  recordingId: string
): Promise<(TranscriptSegment & { id?: string })[]> {
  const client = await getApiClient();
  const res = await client.get(`/recordings/${recordingId}/transcript`);
  return res.data.segments ?? [];
}

// 전사 편집본 저장
export async function saveTranscriptEdits(
  recordingId: string,
  segments: (TranscriptSegment & { id: string })[]
): Promise<void> {
  const client = await getApiClient();
  await client.patch(`/recordings/${recordingId}/transcript`, { segments });
}
```

`src/api/recordings.ts` 파일 최상단에 import 추가:
```typescript
import { TranscriptSegment } from '../types';
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=transcriptStore 2>&1 | tail -20
```

Expected: PASS (4 tests)

- [ ] **Step 6: 커밋**

```bash
git add src/stores/transcriptStore.ts src/api/recordings.ts __tests__/transcriptStore.test.ts
git commit -m "feat: transcriptStore + API 함수 (getTranscript/saveTranscriptEdits)"
```

---

## Task 5: TranscriptScreen.tsx

**Files:**
- Create: `src/features/transcript/TranscriptScreen.tsx`

- [ ] **Step 1: TranscriptScreen 구현**

```typescript
// src/features/transcript/TranscriptScreen.tsx
import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranscriptStore } from '../../stores/transcriptStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { TranscriptSegment } from '../../types';

// 화자 색상 순환 (최대 6명)
const SPEAKER_COLORS = [
  { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  { bg: '#FDF4FF', text: '#9333EA', border: '#E9D5FF' },
  { bg: '#FFF1F2', text: '#E11D48', border: '#FECDD3' },
  { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
];

function speakerColor(label: string) {
  const idx = label.charCodeAt(label.length - 1) % SPEAKER_COLORS.length;
  return SPEAKER_COLORS[idx];
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  navigation: any;
  route: { params: { id: string } };
}

export function TranscriptScreen({ navigation, route }: Props): React.ReactElement {
  const { id } = route.params;
  const {
    segments, editMode, pendingEdits, isLoading, error,
    loadTranscript, toggleEditMode, editSegment, saveEdits, reset,
  } = useTranscriptStore();

  useEffect(() => {
    void loadTranscript(id);
    return () => reset();
  }, [id, loadTranscript, reset]);

  const onSave = async () => {
    await saveEdits();
    if (!useTranscriptStore.getState().error) return;
    Alert.alert('저장 실패', '편집 내용을 저장하지 못했습니다. 다시 시도해주세요.');
  };

  if (isLoading && segments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentBlue} />
      </View>
    );
  }

  if (error && segments.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => void loadTranscript(id)}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>전사 결과</Text>
        <TouchableOpacity
          onPress={editMode ? onSave : toggleEditMode}
          style={styles.editBtn}
          accessibilityLabel={editMode ? '저장' : '편집'}
        >
          <Text style={[styles.editBtnText, editMode && styles.editBtnSave]}>
            {editMode ? '저장' : '편집'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {segments.map((seg) => {
          const sc = speakerColor(seg.speakerLabel);
          const isEditing = editMode;
          const text = pendingEdits[seg.id] ?? seg.text;
          return (
            <View key={seg.id} style={styles.segment}>
              <View style={styles.segMeta}>
                <View style={[styles.speakerChip, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[styles.speakerLabel, { color: sc.text }]}>{seg.speakerLabel}</Text>
                </View>
                <Text style={styles.timestamp}>{formatMs(seg.startMs)}</Text>
              </View>
              {isEditing ? (
                <TextInput
                  style={styles.editInput}
                  value={text}
                  onChangeText={(t) => editSegment(seg.id, t)}
                  multiline
                  accessibilityLabel={`${seg.speakerLabel} 발화 편집`}
                />
              ) : (
                <Text style={styles.segText}>{text}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      {isLoading && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={colors.onPrimary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  backBtn: { paddingRight: spacing.md },
  backIcon: { fontSize: 20, color: colors.onSurface },
  headerTitle: { ...typography.heading, flex: 1, color: colors.onSurface },
  editBtn: { paddingLeft: spacing.md },
  editBtnText: { ...typography.label, color: colors.accentBlue },
  editBtnSave: { color: colors.successGreen },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120 },
  segment: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  segMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  speakerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  speakerLabel: { ...typography.caption },
  timestamp: { ...typography.caption, color: colors.outline },
  segText: { ...typography.body, color: colors.onSurface, paddingLeft: spacing.xs },
  editInput: {
    ...typography.body,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    borderRadius: radius.sm,
    padding: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  retryBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { ...typography.label, color: colors.onPrimary },
  errorText: { ...typography.body, color: colors.error },
  savingOverlay: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | grep TranscriptScreen
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/transcript/TranscriptScreen.tsx
git commit -m "feat: TranscriptScreen — 전사 결과 뷰/편집 화면"
```

---

## Task 6: OnboardingScreen.tsx

**Files:**
- Create: `src/features/onboarding/OnboardingScreen.tsx`

- [ ] **Step 1: OnboardingScreen 구현**

```typescript
// src/features/onboarding/OnboardingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, ListRenderItem,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, typography } from '../../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDED_KEY = '@ibk_stt:onboarded';

interface Slide {
  id: string;
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎙',
    title: '회의 내용을 더 정확하게',
    body: '오프라인 환경에서도 끊김 없이 녹음하고 실시간으로 저장하세요.',
  },
  {
    id: '2',
    emoji: '📤',
    title: '자동 업로드 & 재시도',
    body: '네트워크가 연결되면 자동으로 업로드됩니다. 실패해도 큐에서 자동 재시도합니다.',
  },
  {
    id: '3',
    emoji: '📝',
    title: '전사 결과를 텍스트로',
    body: 'AI가 변환한 전사 결과를 확인하고 편집해 영구 보관하세요.',
  },
];

interface Props {
  navigation: any;
}

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  const flatRef = useRef<FlatList<Slide>>(null);
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;

  const onNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      navigation.replace('PermissionPrimer');
    } else {
      const next = current + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    }
  };

  const onSkip = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    navigation.replace('Login');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationBox}>
        <Text style={styles.illustrationEmoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideBody}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 건너뛰기 */}
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={onSkip} accessibilityLabel="온보딩 건너뛰기">
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* 슬라이드 */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* 닷 인디케이터 */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && styles.dotActive]}
            accessibilityLabel={`슬라이드 ${i + 1} / ${SLIDES.length}`}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? '시작하기' : '다음'}
        >
          <Text style={styles.nextBtnText}>{isLast ? '시작하기' : '다음'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skipRow: {
    height: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  skipText: { ...typography.label, color: colors.secondary },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  illustrationBox: {
    width: 140,
    height: 140,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  illustrationEmoji: { fontSize: 64 },
  slideTitle: {
    ...typography.heading,
    color: colors.textPrimaryLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideBody: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing['3xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  nextBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
});
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/onboarding/OnboardingScreen.tsx
git commit -m "feat: OnboardingScreen — 3슬라이드 온보딩"
```

---

## Task 7: PermissionPrimerScreen.tsx

**Files:**
- Create: `src/features/onboarding/PermissionPrimerScreen.tsx`

- [ ] **Step 1: PermissionPrimerScreen 구현**

```typescript
// src/features/onboarding/PermissionPrimerScreen.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Alert,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { colors, spacing, radius, typography } from '../../theme/tokens';

const PERMISSION_INFOS = [
  {
    icon: '🎙',
    title: '마이크',
    body: '회의 음성을 정확하게 캡처합니다. 오프라인에서도 녹음 가능합니다.',
    required: true,
  },
  {
    icon: '🔔',
    title: '알림 (선택)',
    body: '업로드 완료 및 전사 결과 알림을 받을 수 있습니다.',
    required: false,
  },
];

interface Props {
  navigation: any;
}

export function PermissionPrimerScreen({ navigation }: Props): React.ReactElement {
  const onRequestPermissions = async () => {
    // 마이크 권한 요청
    const micPerm = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.MICROPHONE
      : PERMISSIONS.ANDROID.RECORD_AUDIO;

    const current = await check(micPerm);
    if (current !== RESULTS.GRANTED) {
      const result = await request(micPerm);
      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          '마이크 권한 필요',
          '설정 → 개인 정보 보호 → 마이크에서 IBK STT를 허용해주세요.',
          [{ text: '확인' }]
        );
        return;
      }
    }
    navigation.replace('BiometricEnrollment');
  };

  const onSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.backRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="뒤로">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.micCircle}>
          <Text style={styles.micIcon}>🎙</Text>
        </View>
        <Text style={styles.title}>녹음을 시작하려면{'\n'}마이크 권한이 필요해요</Text>
        <Text style={styles.subtitle}>
          녹음된 음성은 사용자가 직접 업로드하기 전까지 기기에 안전하게 보관되며,
          동의 없이 외부로 공유되지 않습니다.
        </Text>
      </View>

      <View style={styles.infoCards}>
        {PERMISSION_INFOS.map((info) => (
          <View key={info.title} style={styles.infoCard}>
            <Text style={styles.infoIcon}>{info.icon}</Text>
            <Text style={styles.infoText}>{info.body}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onRequestPermissions}
          accessibilityRole="button"
          accessibilityLabel="권한 요청하기"
        >
          <Text style={styles.primaryBtnText}>권한 요청하기</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="나중에"
        >
          <Text style={styles.secondaryBtnText}>나중에</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backRow: {
    height: 56,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.onSurface },
  hero: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  micIcon: { fontSize: 40 },
  title: {
    ...typography.display,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    marginBottom: spacing['2xl'],
  },
  infoCards: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoIcon: { fontSize: 20, marginTop: 1 },
  infoText: { ...typography.label, color: colors.onSurface, flex: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
  secondaryBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.label, color: colors.outline },
});
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/onboarding/PermissionPrimerScreen.tsx
git commit -m "feat: PermissionPrimerScreen — 마이크 권한 설명 화면"
```

---

## Task 8: BiometricEnrollmentScreen.tsx

**Files:**
- Create: `src/features/auth/BiometricEnrollmentScreen.tsx`

- [ ] **Step 1: BiometricEnrollmentScreen 구현**

```typescript
// src/features/auth/BiometricEnrollmentScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface Props {
  navigation: any;
}

export function BiometricEnrollmentScreen({ navigation }: Props): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  const onEnroll = async () => {
    setIsLoading(true);
    try {
      // 생체인증 지원 여부 확인
      const supported = await Keychain.getSupportedBiometryType();
      if (!supported) {
        navigation.replace('Login');
        return;
      }
      // 플래그 저장 — 실제 인증 자격증명은 로그인 후 세션에서 처리
      await Keychain.setGenericPassword(
        '@ibk_stt:biometric_enrolled',
        'true',
        { accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY }
      );
    } catch {
      // 오류: 그냥 로그인으로 진행
    } finally {
      setIsLoading(false);
      navigation.replace('Login');
    }
  };

  const onSkip = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🔐</Text>
        </View>
        <Text style={styles.title}>Face ID로 빠르게 로그인</Text>
        <Text style={styles.body}>
          생체 정보는 기기에 안전하게 저장되며, 앱 세션 잠금 해제 용도로만 사용됩니다.
          정보는 외부로 전송되지 않습니다.
        </Text>

        <View style={styles.reassurance}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.reassuranceText}>사내 보안 정책 준수</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
          onPress={onEnroll}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="생체인증 사용하기"
        >
          {isLoading
            ? <ActivityIndicator color={colors.onPrimary} />
            : <Text style={styles.primaryBtnText}>사용하기</Text>
          }
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={onSkip}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="나중에"
        >
          <Text style={styles.secondaryBtnText}>지금은 안 함</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  icon: { fontSize: 48 },
  title: { ...typography.display, color: colors.primary, textAlign: 'center' },
  body: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  lockIcon: { fontSize: 16 },
  reassuranceText: { ...typography.label, color: colors.onSurfaceVariant },
  footer: {
    width: '100%',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
  secondaryBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.label, color: colors.secondary },
});
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/auth/BiometricEnrollmentScreen.tsx
git commit -m "feat: BiometricEnrollmentScreen — 생체인증 등록 안내"
```

---

## Task 9: navigation/types.ts 업데이트

**Files:**
- Modify: `src/navigation/types.ts`

- [ ] **Step 1: types.ts 업데이트**

```typescript
// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Landing: undefined;          // 온보딩 플래그 체크 → 분기
  Onboarding: undefined;
  PermissionPrimer: undefined;
  BiometricEnrollment: undefined;
  Login: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  RecordingDetail: { id: string };
  Transcript: { id: string };   // id = recordingId
  RecordingModal: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
```

- [ ] **Step 2: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: types.ts 관련 기존 에러만 (새 에러 없음)

- [ ] **Step 3: 커밋**

```bash
git add src/navigation/types.ts
git commit -m "feat: navigation types — AuthStack 온보딩 화면 추가"
```

---

## Task 10: LandingScreen + AuthStack 업데이트

**Files:**
- Create: `src/navigation/LandingScreen.tsx`
- Modify: `src/navigation/AuthStack.tsx`

- [ ] **Step 1: LandingScreen 구현**

```typescript
// src/navigation/LandingScreen.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';
import { colors } from '../theme/tokens';

const ONBOARDED_KEY = '@ibk_stt:onboarded';

interface Props {
  navigation: StackNavigationProp<AuthStackParamList, 'Landing'>;
}

// 최초 실행 여부를 확인하고 즉시 적절한 화면으로 replace한다
export function LandingScreen({ navigation }: Props): React.ReactElement {
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((val) => {
      if (val === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    }).catch(() => {
      navigation.replace('Login');
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accentBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
```

- [ ] **Step 2: AuthStack 업데이트**

```typescript
// src/navigation/AuthStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { LandingScreen } from './LandingScreen';
import { LoginScreen } from '../features/auth/loginScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { PermissionPrimerScreen } from '../features/onboarding/PermissionPrimerScreen';
import { BiometricEnrollmentScreen } from '../features/auth/BiometricEnrollmentScreen';

const Stack = createStackNavigator<AuthStackParamList>();

// 비인증 스택 — Landing이 AsyncStorage를 확인해 Onboarding 또는 Login으로 분기
export function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PermissionPrimer" component={PermissionPrimerScreen} />
      <Stack.Screen name="BiometricEnrollment" component={BiometricEnrollmentScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | grep -E "AuthStack|LandingScreen" | head -10
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/navigation/LandingScreen.tsx src/navigation/AuthStack.tsx
git commit -m "feat: AuthStack — Landing → Onboarding/Login 분기 플로우"
```

---

## Task 11: AuthGate + MainStack 업데이트

**Files:**
- Modify: `src/navigation/AuthGate.tsx`
- Modify: `src/navigation/MainStack.tsx`

- [ ] **Step 1: AuthGate 업데이트 (booting 시 branded splash)**

```typescript
// src/navigation/AuthGate.tsx
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthRoute } from './resolveAuthRoute';
import { SplashScreen } from '../features/auth/splashScreen';

// 외부에서 import 가능하도록 re-export
export { resolveAuthRoute } from './resolveAuthRoute';

interface Props {
  authStack: React.ReactNode;
  mainStack: React.ReactNode;
}

// AuthGate: bootstrap 상태 구독 → 자동 스택 전환
// booting 중 branded SplashScreen 표시 (기존 spinner 제거)
export function AuthGate({ authStack, mainStack }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status) as 'booting' | 'anonymous' | 'authed';
  const bootstrap = useAuthStore((s) => s.bootstrap) as () => Promise<void>;

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const route = resolveAuthRoute(status);

  if (route === 'loading') {
    return <SplashScreen />;
  }

  return <>{route === 'auth' ? authStack : mainStack}</>;
}
```

- [ ] **Step 2: MainStack 업데이트 (TranscriptScreen 연결)**

```typescript
// src/navigation/MainStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList, BottomTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { RecordingListScreen } from '../features/recordings/recordingListScreen';
import { RecordingDetailScreen } from '../features/recordings/recordingDetailScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { RecordingScreen } from '../features/recording-session/RecordingScreen';
import { TranscriptScreen } from '../features/transcript/TranscriptScreen';
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

function BottomTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={RecordingListScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function MainStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen
        name="RecordingDetail"
        component={RecordingDetailScreen}
        options={{ headerShown: true, title: '녹음 상세' }}
      />
      <Stack.Screen
        name="Transcript"
        component={TranscriptScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecordingModal"
        component={RecordingScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 3: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음

- [ ] **Step 4: 커밋**

```bash
git add src/navigation/AuthGate.tsx src/navigation/MainStack.tsx
git commit -m "feat: AuthGate branded splash + MainStack TranscriptScreen 연결"
```

---

## Task 12: SplashScreen UI 업데이트

**Files:**
- Modify: `src/features/auth/splashScreen.tsx`

- [ ] **Step 1: splashScreen.tsx 업데이트**

```typescript
// src/features/auth/splashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, typography, radius } from '../../theme/tokens';

// Stitch splash_screen 매칭 — 배경: background, 중앙 브랜드, 하단 스피너
export function SplashScreen(): React.ReactElement {
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBlock}>
        <Text style={styles.brand}>IBK STT</Text>
        <Text style={styles.tagline}>회의를 텍스트로</Text>
      </View>
      <View style={styles.spinnerBlock}>
        <View style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '40%',
    paddingBottom: '20%',
  },
  brandBlock: { alignItems: 'center' },
  brand: {
    ...typography.display,
    color: colors.onSurface,
    letterSpacing: -1,
  },
  tagline: {
    ...typography.body,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
  },
  spinnerBlock: { alignItems: 'center' },
  spinner: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderTopColor: colors.onSurface,
  },
});
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/auth/splashScreen.tsx
git commit -m "feat: SplashScreen — Stitch 디자인 적용 (branded)"
```

---

## Task 13: RecordingListScreen 업데이트 (홈 화면)

**Files:**
- Modify: `src/features/recordings/recordingListScreen.tsx`
- Modify: `src/features/recordings/recordingCard.tsx`
- Modify: `src/features/recordings/statusBadge.tsx`

- [ ] **Step 1: statusBadge.tsx — 보더 + 아이콘 스타일 추가**

```typescript
// src/features/recordings/statusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Track = 'recording' | 'upload' | 'transcription';

interface BadgeConfig {
  label: string;
  icon: string;
  bg: string;
  text: string;
  border: string;
}

const BADGE_MAP: Record<Track, Record<string, BadgeConfig>> = {
  recording: {
    saved_local: { label: '녹음 완료', icon: '✓', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    recording:   { label: '녹음 중',   icon: '●', bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    paused:      { label: '일시정지',  icon: '⏸', bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    draft:       { label: '초안',      icon: '○', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  },
  upload: {
    not_started: { label: '업로드 대기', icon: '⏳', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
    queued:      { label: '업로드 예정', icon: '↑',  bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
    uploading:   { label: '업로드 중',   icon: '↑',  bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
    uploaded:    { label: '업로드 완료', icon: '✓',  bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    failed:      { label: '업로드 실패', icon: '✕',  bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    retrying:    { label: '재시도 중',   icon: '↻',  bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
  },
  transcription: {
    not_requested: { label: 'STT 대기',    icon: '⏳', bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
    queued:        { label: 'STT 예정',    icon: '☁',  bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
    processing:    { label: 'STT 처리 중', icon: '↻',  bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
    completed:     { label: '전사 완료',   icon: '✓',  bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
    failed:        { label: 'STT 실패',    icon: '✕',  bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    cancelled:     { label: '취소됨',      icon: '○',  bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },
  },
};

interface Props {
  track: Track;
  state: string;
}

// 색 + 텍스트 라벨 병기 필수 (가드레일: 색만으로 상태 구분 금지)
export function StatusBadge({ track, state }: Props): React.ReactElement | null {
  const cfg = BADGE_MAP[track]?.[state];
  if (!cfg) return null;

  return (
    <View
      style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      accessibilityLabel={`${track === 'recording' ? '녹음' : track === 'upload' ? '업로드' : '전사'} 상태: ${cfg.label}`}
      accessibilityRole="text"
    >
      <Text style={[styles.icon, { color: cfg.text }]}>{cfg.icon}</Text>
      <Text style={[styles.label, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: { fontSize: 11, fontFamily: 'HankenGrotesk-Medium' },
  label: { fontSize: 11, fontFamily: 'HankenGrotesk-SemiBold' },
});
```

- [ ] **Step 2: recordingCard.tsx — Stitch 카드 스타일**

```typescript
// src/features/recordings/recordingCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ServerRecordingCache } from '../../types';
import { StatusBadge } from './statusBadge';
import { useUploadProgress } from '../upload/useUploadProgress';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface Props {
  item: ServerRecordingCache;
  onPress: () => void;
  onDelete: () => void;
}

function formatDuration(ms?: number): string {
  if (!ms) return '--:--';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function UploadProgressBar({ recordingId }: { recordingId: string }): React.ReactElement | null {
  const { percent } = useUploadProgress(recordingId);
  if (percent === 0) return null;
  return (
    <View style={styles.progressTrack} accessibilityLabel={`업로드 진행률 ${percent}%`}>
      <View style={[styles.progressFill, { width: `${percent}%` as `${number}%` }]} />
    </View>
  );
}

export function RecordingCard({ item, onPress, onDelete }: Props): React.ReactElement {
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={onDelete}
      accessibilityLabel={`${item.title} 삭제`}
      accessibilityRole="button"
    >
      <Text style={styles.deleteText}>삭제</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
        accessibilityLabel={`${item.title}, ${formatDuration(item.durationMs)}`}
        accessibilityRole="button"
      >
        {/* 타이틀 + 더보기 */}
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.meta}>{formatDate(item.createdAt)} | {formatDuration(item.durationMs)}</Text>
          </View>
          <Text style={styles.moreIcon}>⋮</Text>
        </View>
        {/* 3-track 상태 배지 */}
        <View style={styles.badges}>
          <StatusBadge track="recording" state={item.recordingState} />
          <StatusBadge track="upload" state={item.uploadState} />
          <StatusBadge track="transcription" state={item.transcriptionState} />
        </View>
        {item.uploadState === 'uploading' && <UploadProgressBar recordingId={item.id} />}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleBlock: { flex: 1, marginRight: spacing.sm },
  title: { ...typography.heading, color: colors.primary, marginBottom: spacing.xs },
  meta: { ...typography.body, color: colors.secondary, opacity: 0.7 },
  moreIcon: { fontSize: 20, color: colors.secondary },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  deleteAction: {
    backgroundColor: colors.dangerRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    marginRight: spacing.lg,
  },
  deleteText: { ...typography.label, color: '#FFFFFF' },
  progressTrack: {
    height: 3,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.accentBlue, borderRadius: 2 },
});
```

- [ ] **Step 3: recordingListScreen.tsx — 인사말 헤더 + 필터 칩 업데이트**

상단에 헤더 섹션(`오늘 회의 N건 / {이름} 님`)과 Stitch 스타일 필터 칩을 추가한다. 기존 `controlRow`를 교체한다:

```typescript
// recordingListScreen.tsx — 변경 부분만 발췌
// 1. import 추가
import { useAuthStore } from '../../stores/authStore';

// 2. 컴포넌트 내부 상단에 session 추가
const session = useAuthStore((s) => s.session);

// 3. return 내 SafeAreaView 바로 아래에 헤더 섹션 추가 (controlRow 위):
<View style={styles.homeHeader}>
  <Text style={styles.greetingMeta}>
    오늘 회의 {items.length}건
  </Text>
  <Text style={styles.greetingName}>
    {session?.user.name ?? '안녕하세요'} 님
  </Text>
</View>

// 4. controlRow를 아래로 교체:
<View style={styles.filterRow}>
  <View style={styles.filterPills}>
    {(['all', 'uploading', 'done', 'failed'] as const).map((f) => (
      <TouchableOpacity
        key={f}
        style={[styles.pill, filter === f && styles.pillActive]}
        onPress={() => setFilter(f)}
        accessibilityRole="button"
        accessibilityState={{ selected: filter === f }}
      >
        <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
          {FILTER_LABELS[f]}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
  <TouchableOpacity style={styles.sortBtn} onPress={onToggleSort}>
    <Text style={styles.sortBtnText}>{SORT_LABELS[sort]} ↕</Text>
  </TouchableOpacity>
</View>

// 5. FILTER_LABELS 상수 추가 (컴포넌트 밖)
const FILTER_LABELS: Record<FilterType, string> = {
  all: '전체', uploading: '업로드중', done: '완료', failed: '실패',
};
```

styles에 추가:
```typescript
homeHeader: {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
  paddingBottom: spacing.lg,
  backgroundColor: colors.background,
},
greetingMeta: {
  ...typography.label,
  color: colors.secondary,
  marginBottom: spacing.xs,
},
greetingName: {
  ...typography.display,
  color: colors.primary,
},
filterRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.sm,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLight,
},
filterPills: {
  flex: 1,
  flexDirection: 'row',
  backgroundColor: colors.surfaceContainerLow,
  borderRadius: radius.lg,
  padding: spacing.xs,
  gap: spacing.xs,
},
pill: {
  flex: 1,
  paddingVertical: spacing.sm,
  borderRadius: radius.md,
  alignItems: 'center',
},
pillActive: {
  backgroundColor: colors.primary,
},
pillText: { ...typography.label, color: colors.secondary },
pillTextActive: { color: colors.onPrimary },
sortBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
sortBtnText: { ...typography.label, color: colors.secondary },
```

- [ ] **Step 4: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | grep -E "recordingList|recordingCard|statusBadge" | head -10
```

Expected: 에러 없음

- [ ] **Step 5: 커밋**

```bash
git add src/features/recordings/recordingListScreen.tsx src/features/recordings/recordingCard.tsx src/features/recordings/statusBadge.tsx
git commit -m "feat: 홈 화면 — 인사말 헤더, Stitch 카드/배지 스타일"
```

---

## Task 14: RecordingDetailScreen 업데이트

**Files:**
- Modify: `src/features/recordings/recordingDetailScreen.tsx`

- [ ] **Step 1: 상태 카드 + 오디오 플레이어 + 액션 섹션 추가**

`recordingDetailScreen.tsx`의 `return` 내부 ScrollView 콘텐츠를 아래 구조로 교체한다 (기존 로직/hooks 보존):

```typescript
// recordingDetailScreen.tsx — ScrollView 내부 콘텐츠 교체 부분

// 타이틀 섹션
<View style={styles.titleSection}>
  {isEditingTitle ? (
    <TextInput
      style={styles.titleInput}
      value={editedTitle}
      onChangeText={setEditedTitle}
      onBlur={onSaveTitle}
      autoFocus
      returnKeyType="done"
    />
  ) : (
    <TouchableOpacity onPress={() => setIsEditingTitle(true)} style={styles.titleRow}>
      <Text style={styles.titleText}>{recording.title}</Text>
      <Text style={styles.editIcon}>✎</Text>
    </TouchableOpacity>
  )}
  <Text style={styles.metaText}>
    {new Date(recording.createdAt).toLocaleDateString('ko-KR')} |{' '}
    {recording.durationMs ? `${Math.floor(recording.durationMs / 60000)}:${String(Math.floor((recording.durationMs % 60000) / 1000)).padStart(2, '0')}` : '--:--'}
  </Text>
</View>

{/* 3-track 상태 카드 */}
<View style={styles.statusCard}>
  {[
    { label: '녹음 상태', track: 'recording' as const, state: recording.recordingState },
    { label: '업로드 상태', track: 'upload' as const, state: recording.uploadState },
    { label: '전사 상태', track: 'transcription' as const, state: recording.transcriptionState },
  ].map(({ label, track, state }) => (
    <View key={track} style={styles.statusRow}>
      <Text style={styles.statusLabel}>{label}</Text>
      <StatusBadge track={track} state={state} />
    </View>
  ))}
  {recording.uploadState === 'uploading' && <UploadProgressSection recordingId={recording.id} />}
</View>

{/* 액션 버튼 */}
{(actions.canRetryUpload || actions.canRequestTranscription || actions.canRetryTranscription) && (
  <View style={styles.actionRow}>
    {actions.canRetryUpload && resolvedQueueId && (
      <RetryUploadButton queueId={resolvedQueueId} style={styles.actionBtnOutline} />
    )}
    {(actions.canRequestTranscription || actions.canRetryTranscription) && (
      <RetryTranscriptionButton recordingId={recording.id} style={styles.actionBtnFilled} />
    )}
  </View>
)}

{/* 전사 결과 보기 CTA */}
{recording.transcriptionState === 'completed' && (
  <TouchableOpacity
    style={styles.transcriptBtn}
    onPress={() => navigation.navigate('Transcript', { id: recording.id })}
    accessibilityRole="button"
    accessibilityLabel="전사 결과 보기"
  >
    <Text style={styles.transcriptBtnText}>전사 결과 보기</Text>
  </TouchableOpacity>
)}

{/* 삭제 버튼 */}
<TouchableOpacity
  style={styles.deleteBtn}
  onPress={() => setShowDeleteModal(true)}
  accessibilityRole="button"
  accessibilityLabel="녹음 삭제"
>
  <Text style={styles.deleteBtnText}>✕ 삭제</Text>
</TouchableOpacity>
```

styles에 추가/교체:
```typescript
titleSection: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
titleText: { ...typography.display, color: colors.textPrimaryLight, flex: 1, fontSize: 24 },
titleInput: { ...typography.heading, color: colors.textPrimaryLight, borderBottomWidth: 2, borderBottomColor: colors.accentBlue, paddingBottom: spacing.xs },
editIcon: { fontSize: 16, color: colors.secondary, marginLeft: spacing.sm },
metaText: { ...typography.body, color: colors.secondary },
statusCard: {
  marginHorizontal: spacing.lg,
  marginBottom: spacing.xl,
  padding: spacing.lg,
  borderRadius: radius.xl,
  borderWidth: 1,
  borderColor: colors.borderLight,
  backgroundColor: colors.surfaceContainerLowest,
  gap: spacing.lg,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
},
statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
statusLabel: { ...typography.label, color: colors.textPrimaryLight },
actionRow: {
  flexDirection: 'row',
  gap: spacing.md,
  marginHorizontal: spacing.lg,
  marginBottom: spacing.xl,
},
actionBtnOutline: {
  flex: 1, height: 52,
  borderWidth: 2, borderColor: colors.dangerRed,
  borderRadius: radius.xl,
  alignItems: 'center', justifyContent: 'center',
},
actionBtnFilled: {
  flex: 1, height: 52,
  backgroundColor: colors.primary,
  borderRadius: radius.xl,
  alignItems: 'center', justifyContent: 'center',
  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
},
transcriptBtn: {
  marginHorizontal: spacing.lg,
  height: 52,
  backgroundColor: colors.primary,
  borderRadius: radius.xl,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.xl,
},
transcriptBtnText: { ...typography.heading, color: colors.onPrimary },
deleteBtn: { alignSelf: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
deleteBtnText: { ...typography.label, color: colors.dangerRed, opacity: 0.7 },
```

- [ ] **Step 2: TypeScript 체크**

```bash
npx tsc --noEmit 2>&1 | grep recordingDetail | head -10
```

Expected: 에러 없음

- [ ] **Step 3: 커밋**

```bash
git add src/features/recordings/recordingDetailScreen.tsx
git commit -m "feat: RecordingDetailScreen — 상태 카드 + Transcript CTA + Stitch 스타일"
```

---

## Task 15: RecordingScreen 업데이트

**Files:**
- Modify: `src/features/recording-session/RecordingScreen.tsx`

- [ ] **Step 1: 웨이브폼 + 타이머 + dB 미터 레이아웃 적용**

RecordingScreen의 return 내 구조를 다음으로 교체 (기존 로직/state/animation 보존):

```typescript
// RecordingScreen.tsx — return 교체
return (
  <View style={styles.container}>
    {/* 상단 헤더 (닫기 + 타이머) */}
    <View style={styles.topBar}>
      <TouchableOpacity onPress={onStop} style={styles.closeBtn} accessibilityLabel="녹음 종료">
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      <View style={styles.timerSpacer} />
    </View>

    {/* 웨이브폼 */}
    <View style={styles.waveformSection}>
      <View style={styles.waveform}>
        {waveAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.waveBar,
              {
                transform: [{ scaleY: anim }],
                opacity: isPaused ? 0.3 : 0.8,
              },
            ]}
          />
        ))}
      </View>
    </View>

    {/* 빠른 메모 */}
    <View style={styles.memoSection}>
      <Text style={styles.memoLabel}>빠른 메모</Text>
      <View style={styles.memoInput}>
        <TextInput
          style={styles.memoField}
          value={title}
          onChangeText={setTitle}
          placeholder="녹음 제목 또는 메모..."
          placeholderTextColor={colors.outline}
          returnKeyType="done"
        />
      </View>
    </View>

    {/* 하단 컨트롤 */}
    <View style={styles.controls}>
      <View style={styles.controlButtons}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setIsPaused((p) => !p)}
          accessibilityLabel={isPaused ? '녹음 재개' : '녹음 일시정지'}
          accessibilityRole="button"
        >
          <Text style={styles.pauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          accessibilityLabel="녹음 정지"
          accessibilityRole="button"
        >
          <Text style={styles.stopIcon}>■</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.controlHint}>탭하여 정지</Text>
    </View>

    {/* 저장 모달 (기존 유지) */}
    {/* ... 기존 Modal 코드 그대로 ... */}
  </View>
);
```

styles 교체:
```typescript
container: { flex: 1, backgroundColor: colors.background },
topBar: {
  height: 64,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.lg,
},
closeBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
closeIcon: { fontSize: 20, color: colors.onSurface },
timer: {
  ...typography.display,
  fontSize: 40,
  fontFamily: 'HankenGrotesk-ExtraBold',
  color: colors.primary,
  letterSpacing: -2,
},
timerSpacer: { width: 40 },
waveformSection: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: spacing.xl,
},
waveform: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 80 },
waveBar: {
  width: 4,
  height: 60,
  borderRadius: 2,
  backgroundColor: colors.primary,
},
memoSection: { paddingHorizontal: spacing.xl, marginBottom: spacing['3xl'] },
memoLabel: { ...typography.caption, color: colors.secondary, marginBottom: spacing.sm, paddingLeft: spacing.xs },
memoInput: {
  flexDirection: 'row',
  alignItems: 'center',
  height: 56,
  backgroundColor: colors.surfaceLight,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.borderLight,
  paddingHorizontal: spacing.lg,
},
memoField: { ...typography.body, color: colors.onSurface, flex: 1 },
controls: {
  paddingBottom: 40,
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.lg,
  alignItems: 'center',
  gap: spacing.lg,
},
controlButtons: { flexDirection: 'row', alignItems: 'center', gap: spacing['3xl'] },
pauseBtn: {
  width: 56, height: 56, borderRadius: radius.full,
  backgroundColor: colors.surfaceContainer,
  alignItems: 'center', justifyContent: 'center',
},
pauseIcon: { fontSize: 22, color: colors.primary },
stopBtn: {
  width: 80, height: 80, borderRadius: radius.full,
  backgroundColor: colors.recordingRed,
  alignItems: 'center', justifyContent: 'center',
  shadowColor: colors.recordingRed,
  shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
},
stopIcon: { fontSize: 28, color: '#FFFFFF' },
controlHint: { ...typography.caption, color: colors.secondary },
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/recording-session/RecordingScreen.tsx
git commit -m "feat: RecordingScreen — Stitch 레이아웃 (타이머/웨이브폼/컨트롤)"
```

---

## Task 16: SearchScreen 업데이트

**Files:**
- Modify: `src/features/search/SearchScreen.tsx`

- [ ] **Step 1: 최근 검색어 칩 + 결과 카드 스타일 적용**

SearchScreen의 '빈 상태' 섹션과 '결과' 섹션을 Stitch 디자인으로 교체한다:

```typescript
// SearchScreen.tsx — renderEmpty 교체
const renderEmpty = () => (
  <ScrollView style={styles.emptyScroll} showsVerticalScrollIndicator={false}>
    {/* 최근 검색어 */}
    {recentQueries.length > 0 && (
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>최근 검색</Text>
        <View style={styles.chipRow}>
          {recentQueries.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.recentChip}
              onPress={() => onRecentPress(q)}
              accessibilityRole="button"
              accessibilityLabel={`최근 검색어: ${q}`}
            >
              <Text style={styles.recentChipText}>{q}</Text>
              <TouchableOpacity
                onPress={() => removeRecentQuery(q)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={`${q} 삭제`}
              >
                <Text style={styles.chipRemove}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )}
    {/* 추천 검색 */}
    <View style={styles.recentSection}>
      <Text style={styles.sectionTitle}>추천</Text>
      <View style={styles.chipRow}>
        {['어제', '이번 주 회의', '투자전략'].map((rec) => (
          <TouchableOpacity
            key={rec}
            style={styles.recChip}
            onPress={() => { setQuery(rec); commitQuery(); runSearch(rec, activeTab); }}
            accessibilityRole="button"
          >
            <Text style={styles.recChipText}>{rec}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </ScrollView>
);

// renderResult 교체 (기존 간단한 텍스트 → 카드)
const renderResult = ({ item }: { item: ServerRecordingCache }) => (
  <TouchableOpacity
    style={styles.resultCard}
    onPress={() => navigation.navigate('RecordingDetail', { id: item.id })}
    accessibilityRole="button"
    accessibilityLabel={item.title}
  >
    <View style={styles.resultHeader}>
      <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.resultDate}>
        {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
      </Text>
    </View>
    {item.transcriptPreview && (
      <Text style={styles.resultPreview} numberOfLines={2}>{item.transcriptPreview}</Text>
    )}
  </TouchableOpacity>
);
```

styles 추가:
```typescript
emptyScroll: { flex: 1, paddingHorizontal: spacing.lg },
recentSection: { marginTop: spacing['2xl'] },
sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.md },
chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
recentChip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.xs,
  backgroundColor: colors.surfaceContainerLow,
  borderWidth: 1,
  borderColor: colors.borderLight,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.full,
},
recentChipText: { ...typography.caption, color: colors.primary },
chipRemove: { fontSize: 12, color: colors.secondary },
recChip: {
  backgroundColor: colors.surfaceContainerLow,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderRadius: radius.full,
},
recChipText: { ...typography.caption, color: colors.secondary },
resultCard: {
  backgroundColor: colors.backgroundLight,
  borderWidth: 1,
  borderColor: colors.borderLight,
  borderRadius: radius.lg,
  padding: spacing.lg,
  marginBottom: spacing.md,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
},
resultHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
resultTitle: { ...typography.body, fontFamily: 'HankenGrotesk-Bold', color: colors.primary, flex: 1, marginRight: spacing.lg },
resultDate: { ...typography.caption, color: colors.secondary },
resultPreview: { ...typography.body, color: colors.secondary, lineHeight: 22 },
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/search/SearchScreen.tsx
git commit -m "feat: SearchScreen — 최근 검색어 칩 + Stitch 결과 카드"
```

---

## Task 17: LibraryScreen 업데이트

**Files:**
- Modify: `src/features/library/LibraryScreen.tsx`

- [ ] **Step 1: 세그먼트 탭 + 태그 그룹 헤더 적용**

LibraryScreen의 전체 JSX를 교체한다 (기존 데이터 로직/필터링 유지):

```typescript
// LibraryScreen.tsx — return 교체
const TABS: { key: LibrarySection; label: string }[] = [
  { key: 'starred', label: '즐겨찾기' },
  { key: 'archived', label: '보관함' },
  { key: 'tags', label: '태그' },
];

// 컴포넌트 내 activeTab state 추가
const [activeTab, setActiveTab] = useState<LibrarySection>('starred');

return (
  <SafeAreaView style={styles.container} edges={['top']}>
    {/* 헤더 */}
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>라이브러리</Text>
    </View>

    {/* 세그먼트 탭 */}
    <View style={styles.tabContainer}>
      <View style={styles.tabPills}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
            onPress={() => setActiveTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>

    {/* 콘텐츠 */}
    {activeTab === 'tags' ? (
      <ScrollView contentContainerStyle={styles.tagsList}>
        {allTags.map((tag) => (
          <View key={tag} style={styles.tagGroup}>
            <View style={styles.tagGroupHeader}>
              <View style={styles.tagDot} />
              <Text style={styles.tagGroupTitle}>{tag}</Text>
            </View>
            {items
              .filter((r) => r.tags?.includes(tag))
              .map((r) => (
                <View key={r.id} style={styles.tagCard}>
                  <Text style={styles.tagCardDate}>
                    {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                  </Text>
                  <Text style={styles.tagCardTitle}>{r.title}</Text>
                  <View style={styles.tagChips}>
                    {r.tags.map((t) => (
                      <View key={t} style={styles.tagChip}>
                        <Text style={styles.tagChipText}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
          </View>
        ))}
        {allTags.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>태그가 없습니다</Text>
          </View>
        )}
      </ScrollView>
    ) : (
      <FlatList
        data={activeTab === 'starred' ? starred : archived}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tagCard}>
            <Text style={styles.tagCardDate}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
            <Text style={styles.tagCardTitle}>{item.title}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'starred' ? '즐겨찾기한 녹음이 없습니다' : '보관된 녹음이 없습니다'}
            </Text>
          </View>
        }
      />
    )}
  </SafeAreaView>
);
```

styles 교체:
```typescript
container: { flex: 1, backgroundColor: colors.background },
pageHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
pageTitle: { ...typography.display, color: colors.textPrimaryLight },
tabContainer: { paddingHorizontal: spacing.lg, marginBottom: spacing['2xl'] },
tabPills: {
  flexDirection: 'row',
  backgroundColor: colors.surfaceContainerLow,
  borderRadius: radius.xl,
  padding: spacing.xs,
  borderWidth: 1,
  borderColor: colors.borderLight,
},
tabPill: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center' },
tabPillActive: { backgroundColor: colors.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
tabText: { ...typography.label, color: colors.onSurfaceVariant },
tabTextActive: { color: colors.onPrimary },
tagsList: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
tagGroup: { marginBottom: spacing['3xl'] },
tagGroupHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.sm,
  paddingVertical: spacing.md,
  marginBottom: spacing.lg,
},
tagDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.accentBlue },
tagGroupTitle: { ...typography.heading, color: colors.onSurface },
tagCard: {
  backgroundColor: colors.surfaceContainerLowest,
  borderWidth: 1,
  borderColor: colors.borderLight,
  borderRadius: radius.lg,
  padding: spacing.lg,
  marginBottom: spacing.md,
},
tagCardDate: { ...typography.caption, color: colors.onSurfaceVariant, marginBottom: spacing.md },
tagCardTitle: { ...typography.body, fontFamily: 'HankenGrotesk-Bold', color: colors.onBackground, marginBottom: spacing.sm },
tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
tagChip: {
  backgroundColor: colors.surfaceContainer,
  paddingHorizontal: spacing.sm,
  paddingVertical: 2,
  borderRadius: radius.full,
},
tagChipText: { ...typography.caption, color: colors.onSurfaceVariant },
list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
emptyState: { alignItems: 'center', paddingTop: 80 },
emptyText: { ...typography.body, color: colors.textTertiary },
```

- [ ] **Step 2: import FlatList 추가 확인**

`LibraryScreen.tsx` 상단 import에 `FlatList, useState` 포함 여부 확인

- [ ] **Step 3: 커밋**

```bash
git add src/features/library/LibraryScreen.tsx
git commit -m "feat: LibraryScreen — 세그먼트 탭 + 태그 그룹 Stitch 스타일"
```

---

## Task 18: ProfileScreen 업데이트

**Files:**
- Modify: `src/features/profile/ProfileScreen.tsx`

- [ ] **Step 1: 아바타 헤더 + 설정 리스트 스타일 적용**

ProfileScreen의 return을 아래로 교체 (기존 로직/sections/logout 보존):

```typescript
// ProfileScreen.tsx — return 교체
return (
  <SafeAreaView style={styles.container} edges={['top']}>
    {/* 아바타 헤더 */}
    <View style={styles.profileHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(session?.user.name ?? 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.userName}>{session?.user.name ?? '-'}</Text>
      <Text style={styles.userEmail}>{session?.user.id ?? '-'}</Text>
    </View>

    {/* 설정 리스트 */}
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, item.danger && styles.rowDanger]}
          onPress={item.onPress ?? (() => {})}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          disabled={!item.onPress}
        >
          <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
            {item.label}
          </Text>
          {item.value ? (
            <Text style={styles.rowValue}>{item.value}</Text>
          ) : item.toggle ? (
            <Switch value={false} disabled />
          ) : item.onPress ? (
            <Text style={styles.chevron}>›</Text>
          ) : null}
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
    />
  </SafeAreaView>
);
```

styles 교체:
```typescript
container: { flex: 1, backgroundColor: colors.background },
profileHeader: {
  alignItems: 'center',
  paddingTop: spacing['2xl'],
  paddingBottom: spacing['2xl'],
  paddingHorizontal: spacing.xl,
},
avatar: {
  width: 72, height: 72,
  borderRadius: radius.full,
  backgroundColor: colors.primaryContainer,
  alignItems: 'center', justifyContent: 'center',
  marginBottom: spacing.md,
},
avatarText: {
  fontSize: 28,
  fontFamily: 'HankenGrotesk-Bold',
  color: colors.onPrimaryContainer,
},
userName: { ...typography.heading, color: colors.textPrimaryLight, marginBottom: spacing.xs },
userEmail: { ...typography.body, color: colors.textSecondary },
sectionHeader: {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xl,
  paddingBottom: spacing.sm,
},
sectionTitle: { ...typography.caption, color: colors.secondary, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
row: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderLight,
},
rowDanger: {},
rowLabel: { ...typography.body, color: colors.onSurface },
rowLabelDanger: { color: colors.dangerRed },
rowValue: { ...typography.body, color: colors.secondary },
chevron: { fontSize: 20, color: colors.secondary },
list: { paddingBottom: 120 },
```

- [ ] **Step 2: 커밋**

```bash
git add src/features/profile/ProfileScreen.tsx
git commit -m "feat: ProfileScreen — 아바타 헤더 + 설정 리스트 Stitch 스타일"
```

---

## Task 19: 전체 TypeScript 검증 + 테스트

- [ ] **Step 1: 전체 TS 체크**

```bash
npx tsc --noEmit 2>&1
```

Expected: 에러 없음 (기존 에러는 허용, 신규 에러는 수정)

- [ ] **Step 2: 전체 테스트 실행**

```bash
npm test 2>&1 | tail -30
```

Expected: PASS (기존 테스트 + transcriptStore 테스트)

- [ ] **Step 3: iOS 빌드 확인**

```bash
npx react-native run-ios --simulator "iPhone 15" 2>&1 | tail -20
```

Expected: 빌드 성공, 앱 시뮬레이터 기동

- [ ] **Step 4: Android 빌드 확인**

```bash
npx react-native run-android 2>&1 | tail -20
```

Expected: 빌드 성공

- [ ] **Step 5: 최종 커밋**

```bash
git add -A
git commit -m "feat: Stitch→RN 변환 완료 — 15개 화면 + 폰트 번들링"
```

---

## 완료 체크리스트 (스펙 대조)

| 항목 | Task | 상태 |
|---|---|---|
| AsyncStorage 패키지 | Task 1 | - |
| Hanken Grotesk 폰트 번들 | Task 2 | - |
| tokens.ts 전체 팔레트 | Task 3 | - |
| transcriptStore | Task 4 | - |
| TranscriptScreen | Task 5 | - |
| OnboardingScreen (3슬라이드) | Task 6 | - |
| PermissionPrimerScreen | Task 7 | - |
| BiometricEnrollmentScreen | Task 8 | - |
| navigation types 확장 | Task 9 | - |
| LandingScreen + AuthStack 온보딩 플로우 | Task 10 | - |
| AuthGate branded splash + MainStack | Task 11 | - |
| SplashScreen Stitch 디자인 | Task 12 | - |
| 홈 화면 (인사말/필터/카드) | Task 13 | - |
| RecordingDetailScreen | Task 14 | - |
| RecordingScreen | Task 15 | - |
| SearchScreen | Task 16 | - |
| LibraryScreen | Task 17 | - |
| ProfileScreen | Task 18 | - |
| 전체 검증 | Task 19 | - |

> **가드레일 준수 확인:**
> - LoginScreen: 약관 pre-check 없음 ✓
> - RecordingScreen: 사용자 액션 없이 자동 녹음 시작 없음 ✓
> - 모든 상태 배지: 텍스트 라벨 병기 ✓
> - BiometricEnrollment: Keychain API만 사용, 평문 저장 없음 ✓
