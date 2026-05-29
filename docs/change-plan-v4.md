# IBKS 음성회의록 v4 — 변경 적용 plan

작성일: 2026-05-28
디자인 reference: `docs/demo-v4.html` (브라우저로 열어 확인)
인계 대상: Claude Code (사용자 로컬 RN 환경)

---

## 한 줄 요약

`AI회의록` → `IBKS 음성회의록` 리브랜딩 + 네비 구조 단순화(하단 탭 제거, 우상단 헤더 아이콘) + 라벨 정비("전사" → "음성 변환", "마무리" → "회의종료", "녹음" → "생성", "녹음 재생" → "파일 재생") + 신규 화면 1개(`TranscriptViewScreen`) + 안전장치 2개(⋮ 메뉴, 취소 재확인 Alert, 내부망 안내 배너).

총 12개 항목, 5개 PR 단위로 쪼개 진행 권장.

---

## 작업 순서 (의존성 기준)

```
[PR-1] 리브랜딩 (가장 안전, 라벨만)        → 항목 ②③ ⑤ ⑥ ⑦ ⑩ ⑪
[PR-2] 내부망 안내 배너                    → 항목 ⑨
[PR-3] ⋮ 메뉴 + 취소 재확인 Alert          → 항목 ④ ⑧
[PR-4] STT 결과 화면 (신규)                → 항목 ⑥-신규
[PR-5] 네비 구조 변경 (가장 위험, 마지막)  → 항목 ①
```

PR-1~4는 서로 독립적이라 병렬 진행 가능. PR-5는 모든 화면의 헤더 구조를 건드리므로 마지막에.

---

## 변경 사항 상세 (12개)

### ① 하단 탭 4개 제거 + 우상단 🏠/⚙ 아이콘 도입

**영향 파일**
- `src/navigation/MainStack.tsx` — BottomTabs → StackOnly로 전환
- `src/navigation/CustomTabBar.tsx` — 삭제 또는 FAB 전용으로 축소
- `src/navigation/tabBarConfig.ts` — 4탭 → 단순화
- `src/features/recordings/recordingListScreen.tsx` — 헤더에 아이콘 추가
- `src/features/recordings/recordingDetailScreen.tsx` — 헤더에 아이콘 추가
- `src/features/profile/ProfileScreen.tsx` — 설정 화면화, 헤더에 🏠 표시
- 신규: `src/components/AppTopBar.tsx` — 공용 헤더 컴포넌트

**구현 가이드**
```tsx
// src/components/AppTopBar.tsx (신규)
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface Props {
  title?: string;
  showBack?: boolean;
  active?: 'home' | 'settings';
}

export function AppTopBar({ title, showBack, active }: Props): React.ReactElement {
  const nav = useNavigation<any>();
  return (
    <View style={styles.bar}>
      {showBack ? (
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      ) : <View style={styles.spacer} />}
      <Text style={styles.title}>{title ?? ''}</Text>
      <View style={styles.icons}>
        <TouchableOpacity
          style={[styles.iconBtn, active === 'home' && styles.iconBtnActive]}
          onPress={() => nav.navigate('Home')}
          accessibilityLabel="홈"
        >
          <Text style={styles.icon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, active === 'settings' && styles.iconBtnActive]}
          onPress={() => nav.navigate('Settings')}
          accessibilityLabel="설정"
        >
          <Text style={styles.icon}>⚙</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
// styles 생략 — demo-v4.html .app-topbar / .topbar-icons / .topbar-ic-btn 참조
```

```tsx
// src/navigation/MainStack.tsx — BottomTabs 제거, Stack만 남김
export function MainStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={RecordingListScreen} />
      <Stack.Screen name="Settings" component={ProfileScreen} />
      <Stack.Screen name="RecordingDetail" component={RecordingDetailScreen} />
      <Stack.Screen name="Transcript" component={TranscriptViewScreen} />
      <Stack.Screen
        name="RecordingModal"
        component={RecordingScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
```

**테스트 영향**: `__tests__/navigation.test.ts*` 있으면 BottomTabs 가정 부분 수정 필요.
**위험도**: 높음 — 모든 화면 헤더 영향. PR-5로 마지막에.

---

### ② 앱명 "AI회의록" → "IBKS 음성회의록"

**영향 파일**
- `src/features/auth/splashScreen.tsx:19` — `<Text style={styles.brand}>AI회의록</Text>`
- `src/features/auth/loginScreen.tsx:65` — `<Text style={styles.brandLabel}>AI회의록</Text>`
- `src/features/auth/loginScreen.tsx:76` — `accessibilityLabel="AI회의록 사내 SSO로 로그인"`
- `app.json` — `"name"`, `"displayName"`
- `package.json` — `"name"` (선택)
- `ios/*/Info.plist` — `CFBundleDisplayName`
- `android/app/src/main/res/values/strings.xml` — `app_name`

**Before/After**
```diff
- <Text style={styles.brand}>AI회의록</Text>
+ <Text style={styles.brand}>IBKS 음성회의록</Text>
```

**위험도**: 낮음.

---

### ③ IBK CI 표시 (깨짐 검증)

**현황**: `assets/ibk_logo_big.png` (1200×600 PNG) 정상. `require('../../../assets/ibk_logo_big.png')` 사용 중.

**원인 후보 (Claude Code가 빌드 후 확인)**
1. Metro 캐시 문제 → `npx react-native start --reset-cache`
2. iOS Pod 캐시 → `cd ios && pod install`
3. Android assets sync → clean build
4. 이미지 사이즈가 컨테이너 대비 너무 작아서 안 보이는 것처럼 보임 → `splashScreen.tsx`/`loginScreen.tsx`의 `styles.logo` 크기 확인

**액션**
- 빌드 후 시뮬레이터로 스플래시/로그인 확인
- 로고 사이즈 표준화: 스플래시 `width: 180, height: 72`, 로그인 topbar `height: 32`, login-body 영역은 ⑪에서 제거

**위험도**: 낮음.

---

### ④ 목록 카드 우측 ⋮ 메뉴 → 삭제

**영향 파일**
- `src/features/recordings/recordingCard.tsx` — `⋮` 아이콘에 onPress 추가
- 신규: `src/features/recordings/cardActionSheet.tsx` (또는 `react-native-action-sheet`)

**구현 가이드**
```tsx
// recordingCard.tsx — 기존 ⋮ Text에 onPress 추가
import { ActionSheetIOS, Platform } from 'react-native';

function openMenu() {
  const opts = ['취소', '즐겨찾기', '폴더 이동', '삭제'];
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      { options: opts, destructiveButtonIndex: 3, cancelButtonIndex: 0 },
      (idx) => { if (idx === 3) onDelete(); }
    );
  } else {
    // Android: 간단 Alert 또는 BottomSheet
    Alert.alert('회의 옵션', '', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onDelete },
    ]);
  }
}

// JSX
<TouchableOpacity onPress={openMenu} hitSlop={{top:8,bottom:8,left:8,right:8}}>
  <Text style={styles.moreIcon}>⋮</Text>
</TouchableOpacity>
```

**Stretch**: 커스텀 dropdown 메뉴 (demo-v4.html의 `.card-menu` 참조). MVP는 ActionSheet/Alert로 충분.

**테스트 영향**: `__tests__/recordingCard.test.tsx*` 있으면 ⋮ 탭 시 콜백 호출 검증 추가.
**위험도**: 낮음.

---

### ⑤ "전사" 표기 일괄 정비

**Before → After 라벨 매핑**

| Before | After |
|---|---|
| `'STT 처리 중'` (statusBadge) | `'음성파일 변환중'` |
| `'전사 완료'` | `'변환 완료'` |
| `'STT 실패'` | `'변환 실패'` |
| `'STT 예정'` | `'변환 예정'` |
| `'STT 대기'` | `'변환 대기'` |
| `'전사 결과 보기'` (CTA) | `'음성 변환 내용 보기'` |
| `'전사 결과'` (헤더) | `'음성 변환 내용'` |
| `'전사 결과를 텍스트로'` (onboarding) | `'음성 변환 내용을 텍스트로'` |
| `'전사 결과 알림'` (push) | `'변환 완료 알림'` |
| `'전사 시작'` (수동 트리거 버튼) | `'변환 시작'` |
| `'음성 전사 시작'` (accessibilityLabel) | `'음성 변환 시작'` |

**영향 파일**
- `src/features/recordings/statusBadge.tsx` — transcription 객체 5개 label
- `src/features/recordings/recordingDetailScreen.tsx:248,252,266` — 버튼/접근성
- `src/features/transcript/TranscriptScreen.tsx:78` — 헤더 제목
- `src/features/onboarding/OnboardingScreen.tsx:36-37` — 슬라이드 텍스트
- `src/features/onboarding/PermissionPrimerScreen.tsx:19` — body 텍스트
- `src/features/profile/ProfileScreen.tsx` — 알림 토글 라벨
- `src/stores/transcriptStore.ts:36` — 에러 메시지
- `__tests__/recordingDetailUtils.test.ts` — describe/it 텍스트 (선택)

**주의**: 코드 식별자(`transcription_state`, `TranscriptionState` 등)는 절대 변경 금지. 표시 문구만.

**위험도**: 낮음.

---

### ⑥ STT 변환 내용 확인 화면 (신규 또는 보완)

**현황**: `src/features/transcript/TranscriptScreen.tsx` 이미 존재. 헤더 라벨 ⑤로 정비됨.

**보완**
- 화면 상단에 ⑨ 내부망 안내 배너 추가
- 우상단 🏠/⚙ 아이콘 (PR-5)
- 검색 / 편집 / 내보내기 툴바 (디자인 참조: demo-v4.html `.tx-toolbar`)

**선택**: 화면 이름을 더 명확히 `TranscriptViewScreen.tsx`로 리네이밍 — 안 해도 OK.

**위험도**: 낮음.

---

### ⑦ 저장 모달 버튼 "저장" → "회의종료"

**영향 파일**: `src/features/recording-session/RecordingScreen.tsx:181~190`

**Before/After**
```diff
- <Text style={styles.modalSaveText}>{isSaving ? '저장 중...' : '저장'}</Text>
+ <Text style={styles.modalSaveText}>{isSaving ? '저장 중...' : '회의종료'}</Text>
```

추가로 모달 제목도 변경 권장:
```diff
- <Text style={styles.modalTitle}>녹음 저장</Text>
+ <Text style={styles.modalTitle}>회의 종료</Text>
```

**위험도**: 낮음.

---

### ⑧ 저장 모달 "취소" 시 미저장 재확인 팝업

**영향 파일**: `src/features/recording-session/RecordingScreen.tsx:96, 185`

**Before**
```tsx
const onCancelSave = () => setSaveModalVisible(false);
```

**After**
```tsx
const onCancelSave = () => {
  Alert.alert(
    '회의가 저장되지 않습니다',
    '취소하면 지금까지 녹음한 내용이 모두 삭제됩니다. 계속하시겠습니까?',
    [
      { text: '계속 녹음', style: 'cancel' },
      {
        text: '취소하고 종료',
        style: 'destructive',
        onPress: () => {
          setSaveModalVisible(false);
          navigation.goBack(); // 녹음 폐기 + 모달 닫기
        },
      },
    ],
  );
};
```

**테스트 영향**: `__tests__/RecordingScreen.test.tsx*` 있으면 onCancelSave 분기 추가.
**위험도**: 낮음.

---

### ⑨ 회의 상세 화면 내부망 안내 배너

**영향 파일**: `src/features/recordings/recordingDetailScreen.tsx`

**삽입 위치**: detail-header-card 직후, status-row 직전.

**구현**
```tsx
// 신규 컴포넌트 또는 인라인
function InternalOnlyBanner(): React.ReactElement {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeIcon}>🔒</Text>
      <Text style={styles.noticeText}>
        자동 생성된 회의록은 개인정보 보호를 위해 <Text style={styles.noticeBold}>내부망 PC</Text>에서만 조회 가능합니다.
      </Text>
    </View>
  );
}

// styles — demo-v4.html .notice-banner 참조
notice: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 8,
  padding: 10,
  margin: 12,
  borderRadius: 8,
  backgroundColor: '#fff7ed',
  borderWidth: 1,
  borderColor: '#fdba74',
},
noticeIcon: { fontSize: 14 },
noticeText: { flex: 1, fontSize: 11, color: '#9a3412', lineHeight: 16 },
noticeBold: { fontWeight: '800' },
```

**TranscriptScreen.tsx에도 동일 배너 삽입** (사용자 요청 ⑥과 동일 정책).

**위험도**: 낮음.

---

### ⑩ "녹음 재생" → "파일 재생"

**영향 파일**: `src/features/recordings/recordingDetailScreen.tsx` (재생 버튼이 있다면 — 현 코드엔 미구현일 수 있음. demo-v4.html 기준으로 추가 시 라벨 통일)

**구현 시 라벨**: `'▶ 파일 재생'` / 재생 중: `'■ 재생 중...'`

**위험도**: 낮음.

---

### ⑪ 로그인 화면 메인 가운데 큰 로고 제거

**영향 파일**: `src/features/auth/loginScreen.tsx:62~67` 부근

**Before**
```tsx
<View style={styles.headingSection}>
  <Image
    source={require('../../../assets/ibk_logo_big.png')}
    style={styles.headingLogo}
    resizeMode="contain"
  />
  <Text style={styles.brandLabel}>IBKS 음성회의록</Text>
```

**After** — `<Image>` 삭제 (topbar 로고는 유지)
```tsx
<View style={styles.headingSection}>
  <Text style={styles.brandLabel}>IBKS 음성회의록</Text>
```

**styles.headingLogo** 정의도 함께 제거.

**위험도**: 낮음.

---

### ⑫ 상세 상태 라벨 "녹음" → "생성"

**영향 파일**: `src/features/recordings/statusBadge.tsx`

**Before**
```ts
recording: {
  saved_local: { label: '녹음 완료', ... },
  recording:   { label: '녹음 중',   ... },
  paused:      { label: '일시정지',  ... },
  draft:       { label: '초안',      ... },
},
```

**After**
```ts
recording: {
  saved_local: { label: '생성 완료', ... },
  recording:   { label: '생성 중',   ... },
  paused:      { label: '일시정지',  ... },
  draft:       { label: '초안',      ... },
},
```

추가로 상세 화면 3-track 상태 박스 label:
- `<Text style={styles.statusLabel}>녹음</Text>` → `<Text style={styles.statusLabel}>생성</Text>`

**주의**: 접근성 라벨, 코드 식별자(`recording_state`)는 변경 금지. 표시 문구만.
**위험도**: 낮음.

---

## 검증 체크리스트 (Claude Code용)

빌드/테스트 사이클:
- [ ] `npm install`
- [ ] `npm test` 통과 (또는 변경된 라벨에 맞춰 테스트 업데이트)
- [ ] `cd ios && pod install`
- [ ] `npx react-native start --reset-cache`
- [ ] iOS 시뮬레이터에서 다음 화면 캡처:
  - 스플래시 (앱명 + 로고 정상 표시)
  - 로그인 (가운데 큰 로고 제거 확인, topbar 로고만)
  - 홈 (우상단 🏠/⚙, 카드 ⋮ 메뉴, 하단 탭 없음)
  - 회의 상세 (내부망 배너, 3-track 상태에 "생성/업로드/변환")
  - 녹음 모달 → 정지 → 저장 모달 ("회의종료" 버튼, 취소 시 재확인)
  - 변환 결과 화면 (헤더 "음성 변환 내용")
  - 설정 (우상단 🏠 활성, 하단 탭 없음)
- [ ] Android 동일하게 확인
- [ ] git diff 검토 후 PR 분리 커밋

---

## 디자인 토큰 참조

색상은 `demo-v4.html` 또는 `src/theme/tokens.ts` 확인. 새로 추가할 색상:

```ts
// src/theme/tokens.ts 에 추가
export const noticeColors = {
  bg: '#fff7ed',
  border: '#fdba74',
  text: '#9a3412',
};
```

---

## TBD / 사용자 확인 필요

- ⑫ "녹음 → 생성"의 적용 범위:
  - 현재 명사형 라벨 한정 ("녹음 완료" → "생성 완료", "녹음 중" → "생성 중")
  - 동사형 접근성 라벨 "녹음 시작/종료" 등은 그대로 두는지 확인 필요
  - 모달 제목 "녹음 저장" → "회의 종료" (⑦과 통합)
- 설정 화면 분리 여부:
  - 현재 `ProfileScreen`이 설정 역할. 이름을 `SettingsScreen`으로 리네이밍할지
- 보관함/검색 탭 처리:
  - 하단 탭 제거 후 검색/보관함 진입점은 어디로? (홈 헤더 검색바 / 설정 메뉴 / 별도 모달)

---

## 참고

- 디자인 reference: `docs/demo-v4.html` (10개 화면 iOS/Android 듀얼)
- 기존 메뉴 트리: `docs/menu-tree.md`
- 기존 스펙: `docs/spec.md`
