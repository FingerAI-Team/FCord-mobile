# Navigation + P2 Screens 설계

> 작성일: 2026-05-13
> 범위: BottomTabs + 컷아웃 FAB + Search/Library/Profile/RecordingScreen 신규 구현

## 범위

| 포함 | 제외 |
|------|------|
| react-navigation 설치 및 설정 | SplashScreen, OnboardingCarousel |
| AuthGate (토큰 기반 분기) | PermissionPrimer, BiometricEnroll |
| AuthStack (LoginScreen 연결) | 실제 IBK SSO 연동 |
| MainStack (BottomTabs + Stack) | TranscriptScreen 구현 |
| CustomTabBar (컷아웃 FAB) | WatermelonDB 실데이터 연결 |
| RecordingScreen (기본 UI) | 실제 마이크 녹음 로직 |
| SearchScreen | |
| LibraryScreen | |
| ProfileScreen | |

## 패키지

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-screens react-native-safe-area-context
```

- `react-native-gesture-handler` — 이미 설치됨

## 아키텍처

```
App.tsx
└── NavigationContainer + ThemeProvider
    └── AuthGate (authStore 구독)
        ├── 미인증 → AuthStack
        │   └── LoginScreen (MockSSOProvider 연결)
        └── 인증 → MainStack
            ├── BottomTabs (CustomTabBar)
            │   ├── HomeTab       → RecordingListScreen (기존)
            │   ├── SearchTab     → SearchScreen [신규]
            │   ├── [FAB]         → RecordingScreen (Modal) [신규]
            │   ├── LibraryTab    → LibraryScreen [신규]
            │   └── ProfileTab    → ProfileScreen [신규]
            └── Stack (탭 위 푸시)
                ├── RecordingDetailScreen (기존)
                └── TranscriptScreen (placeholder)
```

## 파일 구조

```
src/navigation/
  AppNavigator.tsx      앱 진입점, NavigationContainer 래핑
  AuthStack.tsx         비인증 스택 (Login)
  MainStack.tsx         인증 스택 (BottomTabs + Stack)
  CustomTabBar.tsx      컷아웃 FAB 커스텀 탭바
  types.ts              RootStackParamList, BottomTabParamList 타입 정의

src/features/
  search/
    SearchScreen.tsx
  library/
    LibraryScreen.tsx
  profile/
    ProfileScreen.tsx
  recording-session/
    RecordingScreen.tsx
```

## 컴포넌트별 설계

### CustomTabBar

- `tabBar` prop 커스텀 컴포넌트로 교체
- 탭 5개 (Home, Search, _, Library, Profile) + 가운데 컷아웃
- FAB: `position: absolute`, `top: -28`, `borderRadius: 30`, `backgroundColor: recordingRed(#EF4444)`
- FAB 탭 시 `navigation.navigate('RecordingModal')` — 탭 활성 상태 변경 없음
- 컷아웃: 탭바 배경에 반원 오목 처리 (View + overflow: hidden)
- 토큰: `design-system.md` → `src/theme/tokens.ts` 그대로 사용

### AuthGate

- `authStore`의 `isAuthenticated` 구독
- 토큰 있음 → MainStack, 없음 → AuthStack
- 초기 로딩 중 SplashScreen 자리 (이번엔 ActivityIndicator fallback)

### RecordingScreen (기본 UI)

- Modal Stack으로 진입 (BottomTabs 위에 올라옴)
- 상단: 타이머 (00:00 포맷)
- 중앙: 파형 placeholder (Animated.View 막대 5개)
- 하단: 일시정지 버튼 + 정지 버튼
- 정지 → SaveSheet (Bottom Sheet: 제목 입력 + 저장/취소)
- 저장 → 화면 닫기 (실제 녹음 로직은 다음 태스크)

### SearchScreen

- SearchBar autofocus (TextInput ref)
- 최근 검색어: Zustand `searchStore` (간단한 string[] 배열, persist 없음)
- 결과 탭: useState 기반 3버튼 탭 (제목 / 본문 / 메모) — 추가 패키지 없음, 이번엔 빈 리스트 + EmptyState
- 결과 카드 탭 → `navigation.push('RecordingDetail', { id })`

### LibraryScreen

- SectionList 3섹션: 즐겨찾기 / 보관함 / 태그별
- 각 섹션 EmptyState 컴포넌트 (기존 EmptyStateView 재사용)
- 태그 편집: BottomSheet (이번엔 Modal 기반 간이 구현)
- 데이터: recordingListStore에서 starred/archived 필터

### ProfileScreen

- SectionList로 설정 항목 렌더링
- 섹션: 사용자 정보 / 보안 / 동기화 / 알림 / 데이터 관리 / 앱 정보
- 로그아웃: Alert (확인) → `authStore.logout()` → AuthStack 자동 전환
- 각 row: 아이콘 + 레이블 + 값/토글/arrow

## 상태 연결

| 화면 | 스토어 |
|------|--------|
| AuthGate | authStore.isAuthenticated |
| ProfileScreen 로그아웃 | authStore.logout() |
| LibraryScreen 데이터 | recordingListStore (starred/archived 필터) |
| SearchScreen 최근 검색어 | searchStore (신규, 간단한 zustand slice) |

## 타입 정의

```typescript
// navigation/types.ts
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  RecordingModal: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  RecordingDetail: { id: string };
  Transcript: { id: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};
```

## 에러 처리

- AuthGate 토큰 체크 실패 → AuthStack 전환 (토큰 만료 포함)
- RecordingScreen 저장 취소 → 모달 닫기만
- SearchScreen 검색 실패 → EmptyState with 에러 메시지

## 테스트 범위

- `CustomTabBar.test.tsx`: FAB 렌더링, 탭 전환
- `AuthGate.test.tsx`: 인증/미인증 분기
- `SearchScreen.test.tsx`: 최근 검색어 저장/삭제
- `ProfileScreen.test.tsx`: 로그아웃 플로우

## 완료 기준

- [ ] BottomTabs 5탭 전환 동작
- [ ] FAB 탭 → RecordingScreen 모달 진입
- [ ] 로그인 → MainStack, 로그아웃 → AuthStack 자동 전환
- [ ] Search/Library/Profile 화면 진입 가능
- [ ] 테스트 4개 통과
