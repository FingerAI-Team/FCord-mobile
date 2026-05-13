# Navigation + P2 Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** BottomTabs + 컷아웃 FAB 네비게이션 구조를 구축하고 Search / Library / Profile / RecordingScreen 4개 신규 화면을 연결한다.

**Architecture:** react-navigation의 Stack + BottomTabs를 조합한다. AuthGate가 authStore.status를 구독해 AuthStack/MainStack을 자동 전환한다. FAB는 tabBar 커스텀 컴포넌트(CustomTabBar)로 구현하며, 탭 인덱스 없이 Modal Stack으로 RecordingScreen에 진입한다.

**Tech Stack:** @react-navigation/native 7.x, @react-navigation/bottom-tabs, @react-navigation/stack, react-native-screens, react-native-safe-area-context, zustand (기존), react-native (기존)

---

## 파일 구조

```
신규 생성:
  src/navigation/types.ts
  src/navigation/AppNavigator.tsx
  src/navigation/AuthStack.tsx
  src/navigation/MainStack.tsx
  src/navigation/CustomTabBar.tsx
  src/stores/searchStore.ts
  src/features/search/SearchScreen.tsx
  src/features/library/LibraryScreen.tsx
  src/features/profile/ProfileScreen.tsx
  src/features/recording-session/RecordingScreen.tsx
  __mocks__/@react-navigation/native.ts
  __tests__/authGate.test.ts
  __tests__/customTabBar.test.ts
  __tests__/searchStore.test.ts
  __tests__/profileLogout.test.ts

수정:
  package.json  (패키지 추가)
  App.tsx       (AppNavigator로 교체)
  jest.config.js (네비게이션 mock 경로 추가)
```

---

## Task 1: 패키지 설치 + Jest mock 추가

**Files:**
- Modify: `package.json`
- Modify: `jest.config.js`
- Create: `__mocks__/@react-navigation/native.ts`

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/leokim/workspace/ibk_stt
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack react-native-screens react-native-safe-area-context
```

Expected: `package.json`의 dependencies에 5개 패키지 추가됨.

- [ ] **Step 2: jest.config.js에 @react-navigation mock 경로 추가**

`jest.config.js`의 `moduleNameMapper`에 아래 항목을 추가한다:

```js
'^@react-navigation/(.*)$': '<rootDir>/__mocks__/@react-navigation/native.ts',
```

최종 `jest.config.js`:

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    '^react-native-keychain$': '<rootDir>/__mocks__/react-native-keychain.ts',
    '^react-native-(.*)$': '<rootDir>/__mocks__/react-native-stub.ts',
    '^@nozbe/watermelondb(.*)$': '<rootDir>/__mocks__/watermelondb.ts',
    '^@react-native-community/(.*)$': '<rootDir>/__mocks__/react-native-stub.ts',
    '^@react-navigation/(.*)$': '<rootDir>/__mocks__/@react-navigation/native.ts',
    '^zustand$': '<rootDir>/__mocks__/zustand.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};
```

- [ ] **Step 3: @react-navigation mock 파일 생성**

```bash
mkdir -p __mocks__/@react-navigation
```

`__mocks__/@react-navigation/native.ts` 생성:

```typescript
export const useNavigation = jest.fn(() => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
}));

export const useRoute = jest.fn(() => ({ params: {} }));
export const NavigationContainer = ({ children }: { children: React.ReactNode }) => children;
export const createStackNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));
export const createBottomTabNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));
```

- [ ] **Step 4: 기존 테스트가 여전히 통과하는지 확인**

```bash
npm test
```

Expected: 기존 5개 테스트 전부 PASS. 새 mock이 기존 테스트를 깨지 않아야 함.

- [ ] **Step 5: 커밋**

```bash
git add package.json package-lock.json jest.config.js __mocks__/@react-navigation/native.ts
git commit -m "chore: react-navigation 패키지 설치 및 Jest mock 추가"
```

---

## Task 2: 네비게이션 타입 정의

**Files:**
- Create: `src/navigation/types.ts`

- [ ] **Step 1: 타입 파일 생성**

`src/navigation/types.ts`:

```typescript
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

// RecordingModal은 MainStack 내부 modal로 처리 (RootStack 불필요)
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  RecordingDetail: { id: string };
  Transcript: { id: string };
  RecordingModal: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
```

- [ ] **Step 2: 커밋**

```bash
git add src/navigation/types.ts
git commit -m "feat: 네비게이션 타입 정의 추가"
```

---

## Task 3: AuthGate 로직 + 테스트

AuthGate는 `authStore.status`를 기반으로 어느 스택을 렌더할지 결정하는 순수 함수다.
테스트는 이 결정 로직만 검증한다 (컴포넌트 렌더 없이).

**Files:**
- Create: `__tests__/authGate.test.ts`
- Create: `src/navigation/AuthGate.tsx`

- [ ] **Step 1: 실패할 테스트 작성**

`__tests__/authGate.test.ts`:

```typescript
// AuthGate 라우팅 결정 로직 테스트 (상태 → 스택 매핑)
import { resolveAuthRoute } from '../src/navigation/AuthGate';

describe('resolveAuthRoute', () => {
  it('booting 상태에서는 loading을 반환한다', () => {
    expect(resolveAuthRoute('booting')).toBe('loading');
  });

  it('anonymous 상태에서는 auth를 반환한다', () => {
    expect(resolveAuthRoute('anonymous')).toBe('auth');
  });

  it('authed 상태에서는 main을 반환한다', () => {
    expect(resolveAuthRoute('authed')).toBe('main');
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm test -- --testPathPattern=authGate
```

Expected: `Cannot find module '../src/navigation/AuthGate'`

- [ ] **Step 3: AuthGate 구현**

`src/navigation/AuthGate.tsx`:

```typescript
import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/tokens';

type AuthRoute = 'loading' | 'auth' | 'main';

// 상태 → 라우트 순수 함수 (테스트 가능하도록 export)
export function resolveAuthRoute(status: 'booting' | 'anonymous' | 'authed'): AuthRoute {
  if (status === 'booting') return 'loading';
  if (status === 'anonymous') return 'auth';
  return 'main';
}

interface Props {
  authStack: React.ReactNode;
  mainStack: React.ReactNode;
}

// AuthGate: status 구독 → 자동 스택 전환
export function AuthGate({ authStack, mainStack }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const route = resolveAuthRoute(status);

  if (route === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return <>{route === 'auth' ? authStack : mainStack}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=authGate
```

Expected: 3 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/navigation/AuthGate.tsx __tests__/authGate.test.ts
git commit -m "feat: AuthGate 라우팅 로직 추가 (booting/anonymous/authed → 스택 전환)"
```

---

## Task 4: CustomTabBar (컷아웃 FAB) + 테스트

**Files:**
- Create: `__tests__/customTabBar.test.ts`
- Create: `src/navigation/CustomTabBar.tsx`

- [ ] **Step 1: 실패할 테스트 작성**

`__tests__/customTabBar.test.ts`:

```typescript
// CustomTabBar 핵심 로직: 탭 인덱스 매핑, FAB 판별
import { getTabConfig, isFabSlot } from '../src/navigation/CustomTabBar';

describe('getTabConfig', () => {
  it('Home(0) 탭의 레이블이 홈이다', () => {
    expect(getTabConfig(0).label).toBe('홈');
  });

  it('Search(1) 탭의 레이블이 검색이다', () => {
    expect(getTabConfig(1).label).toBe('검색');
  });

  it('Library(2) 탭의 레이블이 보관함이다', () => {
    expect(getTabConfig(2).label).toBe('보관함');
  });

  it('Profile(3) 탭의 레이블이 프로필이다', () => {
    expect(getTabConfig(3).label).toBe('프로필');
  });
});

describe('isFabSlot', () => {
  it('인덱스 2는 FAB 슬롯이다', () => {
    expect(isFabSlot(2)).toBe(true);
  });

  it('인덱스 0은 FAB 슬롯이 아니다', () => {
    expect(isFabSlot(0)).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm test -- --testPathPattern=customTabBar
```

Expected: `Cannot find module '../src/navigation/CustomTabBar'`

- [ ] **Step 3: CustomTabBar 구현**

`src/navigation/CustomTabBar.tsx`:

```typescript
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  type ViewStyle,
} from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius, typography } from '../theme/tokens';

// 탭 인덱스 → 레이블/아이콘 매핑 (FAB 슬롯 제외)
// BottomTabParamList 순서: Home(0), Search(1), [FAB slot=2], Library(2→3), Profile(3→4)
// react-navigation은 4개 탭만 알고 있음. FAB는 렌더 시 가운데에 주입.

interface TabConfig {
  label: string;
  icon: string; // 임시 텍스트 아이콘, 추후 벡터 아이콘으로 교체
}

const TAB_CONFIGS: TabConfig[] = [
  { label: '홈', icon: '🏠' },
  { label: '검색', icon: '🔍' },
  { label: '보관함', icon: '📚' },
  { label: '프로필', icon: '👤' },
];

// 렌더 순서에서 인덱스 2는 FAB 슬롯 (가운데)
export function isFabSlot(renderIndex: number): boolean {
  return renderIndex === 2;
}

// 탭 인덱스(0~3) → TabConfig
export function getTabConfig(index: number): TabConfig {
  return TAB_CONFIGS[index];
}

const TAB_BAR_HEIGHT = 64;
const FAB_SIZE = 60;
const FAB_OFFSET = 28; // 탭바 위로 튀어나오는 높이

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  // state.routes는 4개 (Home, Search, Library, Profile)
  // 렌더 시 가운데(index 2)에 FAB 슬롯 삽입 → 총 5개 셀

  const onFabPress = () => {
    navigation.navigate('RecordingModal' as never);
  };

  const renderTabCell = (routeIndex: number, renderIndex: number) => {
    const route = state.routes[routeIndex];
    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const config = getTabConfig(routeIndex);

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
        onPress={onPress}
        style={styles.tabCell}
      >
        <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{config.icon}</Text>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{config.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* 컷아웃 FAB — 탭바 위에 절대 위치 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="녹음 시작"
      >
        <Text style={styles.fabIcon}>🎙</Text>
      </TouchableOpacity>

      {/* 탭바 본체 */}
      <View style={styles.tabBar}>
        {/* 왼쪽 2개 탭 */}
        {renderTabCell(0, 0)}
        {renderTabCell(1, 1)}
        {/* FAB 공간 (빈 셀) */}
        <View style={styles.fabPlaceholder} />
        {/* 오른쪽 2개 탭 */}
        {renderTabCell(2, 3)}
        {renderTabCell(3, 4)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
  } as ViewStyle,

  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    alignItems: 'center',
  } as ViewStyle,

  tabCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  } as ViewStyle,

  fabPlaceholder: {
    width: FAB_SIZE + spacing.xl,
  } as ViewStyle,

  fab: {
    position: 'absolute',
    top: -(FAB_OFFSET),
    alignSelf: 'center',
    left: '50%',
    marginLeft: -(FAB_SIZE / 2),
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
    // 그림자 (iOS)
    shadowColor: colors.recordingRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    // 그림자 (Android)
    elevation: 8,
    zIndex: 10,
  } as ViewStyle,

  fabIcon: {
    fontSize: 26,
  },

  tabIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },
});
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=customTabBar
```

Expected: 6 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add src/navigation/CustomTabBar.tsx __tests__/customTabBar.test.ts
git commit -m "feat: 컷아웃 FAB CustomTabBar 구현"
```

---

## Task 5: AuthStack + MainStack + AppNavigator

**Files:**
- Create: `src/navigation/AuthStack.tsx`
- Create: `src/navigation/MainStack.tsx`
- Create: `src/navigation/AppNavigator.tsx`

- [ ] **Step 1: AuthStack 생성**

`src/navigation/AuthStack.tsx`:

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../features/auth/LoginScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 2: MainStack 생성**

`src/navigation/MainStack.tsx`:

```typescript
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
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// BottomTabs: 4개 탭 (FAB는 CustomTabBar에서 주입)
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

// MainStack: BottomTabs 위에 Detail/Transcript/RecordingModal 푸시
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
        // TranscriptScreen은 추후 구현 — 임시 placeholder
        component={() => null}
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

- [ ] **Step 3: AppNavigator 생성**

`src/navigation/AppNavigator.tsx`:

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthGate } from './AuthGate';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <AuthGate
        authStack={<AuthStack />}
        mainStack={<MainStack />}
      />
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: App.tsx를 AppNavigator로 교체**

기존 `App.tsx` 내용을 확인한 후 아래로 교체:

```typescript
import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App(): React.ReactElement {
  return <AppNavigator />;
}
```

- [ ] **Step 5: 기존 테스트 전체 통과 확인**

```bash
npm test
```

Expected: 전체 PASS (새 파일들은 타입 에러 없이 컴파일되어야 함)

- [ ] **Step 6: 커밋**

```bash
git add src/navigation/AuthStack.tsx src/navigation/MainStack.tsx src/navigation/AppNavigator.tsx App.tsx
git commit -m "feat: AuthStack/MainStack/AppNavigator 네비게이션 구조 완성"
```

---

## Task 6: searchStore + SearchScreen

**Files:**
- Create: `src/stores/searchStore.ts`
- Create: `src/features/search/SearchScreen.tsx`
- Create: `__tests__/searchStore.test.ts`

- [ ] **Step 1: 실패할 테스트 작성**

`__tests__/searchStore.test.ts`:

```typescript
import { useSearchStore } from '../src/stores/searchStore';

describe('searchStore', () => {
  beforeEach(() => {
    useSearchStore.setState({ query: '', recentQueries: [], results: [] });
  });

  it('초기 상태: 쿼리 빈 문자열, 최근 검색어 빈 배열', () => {
    const { query, recentQueries } = useSearchStore.getState();
    expect(query).toBe('');
    expect(recentQueries).toHaveLength(0);
  });

  it('setQuery로 쿼리가 업데이트된다', () => {
    useSearchStore.getState().setQuery('회의');
    expect(useSearchStore.getState().query).toBe('회의');
  });

  it('commitQuery로 최근 검색어에 추가된다', () => {
    useSearchStore.getState().setQuery('회의록');
    useSearchStore.getState().commitQuery();
    expect(useSearchStore.getState().recentQueries[0]).toBe('회의록');
  });

  it('중복 쿼리는 최근 검색어에 중복 저장되지 않는다', () => {
    useSearchStore.getState().setQuery('테스트');
    useSearchStore.getState().commitQuery();
    useSearchStore.getState().setQuery('테스트');
    useSearchStore.getState().commitQuery();
    const { recentQueries } = useSearchStore.getState();
    expect(recentQueries.filter((q) => q === '테스트')).toHaveLength(1);
  });

  it('빈 쿼리는 최근 검색어에 추가되지 않는다', () => {
    useSearchStore.getState().setQuery('');
    useSearchStore.getState().commitQuery();
    expect(useSearchStore.getState().recentQueries).toHaveLength(0);
  });

  it('removeRecentQuery로 특정 검색어를 삭제한다', () => {
    useSearchStore.setState({ recentQueries: ['회의', '인터뷰', '현장'] });
    useSearchStore.getState().removeRecentQuery('인터뷰');
    expect(useSearchStore.getState().recentQueries).toEqual(['회의', '현장']);
  });

  it('최근 검색어는 최대 10개를 초과하지 않는다', () => {
    const store = useSearchStore.getState();
    for (let i = 0; i < 12; i++) {
      store.setQuery(`쿼리${i}`);
      store.commitQuery();
    }
    expect(useSearchStore.getState().recentQueries.length).toBeLessThanOrEqual(10);
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm test -- --testPathPattern=searchStore
```

Expected: `Cannot find module '../src/stores/searchStore'`

- [ ] **Step 3: searchStore 구현**

`src/stores/searchStore.ts`:

```typescript
import { create } from 'zustand';

const MAX_RECENT = 10;

interface SearchState {
  query: string;
  recentQueries: string[];
  results: string[]; // 추후 ServerRecordingCache[]로 교체

  setQuery: (q: string) => void;
  commitQuery: () => void;         // 현재 query를 recentQueries 앞에 추가
  removeRecentQuery: (q: string) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  recentQueries: [],
  results: [],

  setQuery: (q) => set({ query: q }),

  commitQuery: () => {
    const { query, recentQueries } = get();
    const trimmed = query.trim();
    if (!trimmed) return;
    // 중복 제거 후 앞에 추가, 최대 10개
    const updated = [trimmed, ...recentQueries.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
    set({ recentQueries: updated });
  },

  removeRecentQuery: (q) =>
    set((s) => ({ recentQueries: s.recentQueries.filter((r) => r !== q) })),

  clearResults: () => set({ results: [] }),
}));
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=searchStore
```

Expected: 7 tests PASS

- [ ] **Step 5: SearchScreen 구현**

`src/features/search/SearchScreen.tsx`:

```typescript
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useSearchStore } from '../../stores/searchStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

type SearchTab = 'title' | 'body' | 'memo';

export function SearchScreen(): React.ReactElement {
  const inputRef = useRef<TextInput>(null);
  const { query, recentQueries, setQuery, commitQuery, removeRecentQuery } = useSearchStore();
  const [activeTab, setActiveTab] = useState<SearchTab>('title');

  const onSubmit = () => {
    commitQuery();
    // 실제 API 호출은 추후 구현
  };

  const onRecentPress = (q: string) => {
    setQuery(q);
    commitQuery();
  };

  const tabs: { key: SearchTab; label: string }[] = [
    { key: 'title', label: '제목' },
    { key: 'body', label: '본문' },
    { key: 'memo', label: '메모' },
  ];

  return (
    <View style={styles.container}>
      {/* SearchBar */}
      <View style={styles.searchBarWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="녹음 검색..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="검색어 지우기">
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 결과 탭 (state 기반 3버튼) */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* 최근 검색어 (쿼리 없을 때만 표시) */}
        {query.length === 0 && recentQueries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 검색어</Text>
            <View style={styles.chipRow}>
              {recentQueries.map((q) => (
                <View key={q} style={styles.chip}>
                  <TouchableOpacity onPress={() => onRecentPress(q)}>
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeRecentQuery(q)}
                    accessibilityLabel={`${q} 삭제`}
                  >
                    <Text style={styles.chipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 검색 결과 (추후 API 연결) */}
        {query.length > 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
            <Text style={styles.emptySubtext}>다른 검색어를 입력해보세요</Text>
          </View>
        )}

        {/* 초기 상태 */}
        {query.length === 0 && recentQueries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙</Text>
            <Text style={styles.emptyText}>녹음을 검색하세요</Text>
            <Text style={styles.emptySubtext}>제목, 전사 본문, 메모로 검색할 수 있습니다</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textSecondary,
    padding: spacing.xs,
  },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: { ...typography.label, color: colors.textSecondary },
  tabLabelActive: { color: colors.textPrimary },

  body: { flex: 1 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  chipText: { ...typography.body, color: colors.textPrimary, fontSize: 13 },
  chipRemove: { color: colors.textSecondary, fontSize: 12 },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
```

- [ ] **Step 6: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 전체 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/stores/searchStore.ts src/features/search/SearchScreen.tsx __tests__/searchStore.test.ts
git commit -m "feat: searchStore + SearchScreen 구현"
```

---

## Task 7: LibraryScreen

**Files:**
- Create: `src/features/library/LibraryScreen.tsx`

- [ ] **Step 1: LibraryScreen 구현**

`src/features/library/LibraryScreen.tsx`:

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

type LibrarySection = 'starred' | 'archived' | 'tags';

interface Section {
  key: LibrarySection;
  title: string;
  icon: string;
  data: string[]; // 임시: 항목 ID 배열, 추후 ServerRecordingCache[]로 교체
}

export function LibraryScreen(): React.ReactElement {
  const items = useRecordingListStore((s) => s.items);
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState('');

  // 즐겨찾기/보관함 필터 (starred/archived 필드 추후 추가 전 임시 빈 배열)
  const sections: Section[] = [
    {
      key: 'starred',
      title: '즐겨찾기',
      icon: '⭐',
      data: [], // TODO: items.filter(i => i.starred).map(i => i.id)
    },
    {
      key: 'archived',
      title: '보관함',
      icon: '📦',
      data: [], // TODO: items.filter(i => i.upload_state === 'archived').map(i => i.id)
    },
    {
      key: 'tags',
      title: '태그별',
      icon: '🏷',
      data: [], // TODO: 태그 목록
    },
  ];

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionIcon}>{section.icon}</Text>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      {section.key === 'tags' && (
        <TouchableOpacity
          onPress={() => setTagModalVisible(true)}
          accessibilityLabel="태그 편집"
        >
          <Text style={styles.editLink}>편집</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyForSection = (section: Section) => (
    <View style={styles.sectionEmpty}>
      <Text style={styles.sectionEmptyText}>
        {section.key === 'starred' && '즐겨찾기한 녹음이 없습니다'}
        {section.key === 'archived' && '보관함이 비어있습니다'}
        {section.key === 'tags' && '태그가 없습니다'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item, section }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? renderEmptyForSection(section) : null
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      {/* 태그 편집 Modal (간이 구현) */}
      <Modal
        visible={tagModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>태그 편집</Text>
            <TextInput
              style={styles.tagInput}
              value={editingTag}
              onChangeText={setEditingTag}
              placeholder="새 태그 입력"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setTagModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 24, fontWeight: '800' },

  listContent: { paddingBottom: spacing['3xl'] },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { ...typography.label, color: colors.textSecondary },
  editLink: { ...typography.caption, color: colors.accentBlue },

  sectionEmpty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionEmptyText: { ...typography.body, color: colors.textSecondary },

  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemText: { ...typography.body, color: colors.textPrimary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg },
  tagInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalClose: {
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCloseText: { ...typography.label, color: colors.accentBlue },
});
```

- [ ] **Step 2: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 전체 PASS

- [ ] **Step 3: 커밋**

```bash
git add src/features/library/LibraryScreen.tsx
git commit -m "feat: LibraryScreen 구현 (즐겨찾기/보관함/태그 섹션)"
```

---

## Task 8: ProfileScreen + 로그아웃 테스트

**Files:**
- Create: `src/features/profile/ProfileScreen.tsx`
- Create: `__tests__/profileLogout.test.ts`

- [ ] **Step 1: 실패할 테스트 작성**

`__tests__/profileLogout.test.ts`:

```typescript
// ProfileScreen 로그아웃 플로우: authStore.logout() 호출 → status가 anonymous로 전환
import { useAuthStore } from '../src/stores/authStore';

describe('authStore.logout', () => {
  beforeEach(() => {
    // authed 상태로 설정
    useAuthStore.setState({
      status: 'authed',
      session: {
        user: { id: '12345', name: '홍길동', department: '기술부' },
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        expiresAt: Date.now() + 3600_000,
        providerName: 'mock-sso',
      },
      error: null,
      isSubmitting: false,
    });
  });

  it('logout 호출 후 status가 anonymous가 된다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('logout 후 session이 null이 된다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('logout 후 error가 null이다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실행 → FAIL 확인**

```bash
npm test -- --testPathPattern=profileLogout
```

Expected: 테스트 실행되어야 하며, keychain mock이 연결되면 PASS 또는 구현 필요 항목에서 FAIL.

- [ ] **Step 3: 테스트 통과 확인**

```bash
npm test -- --testPathPattern=profileLogout
```

Expected: 3 tests PASS (authStore.logout은 이미 구현됨)

- [ ] **Step 4: ProfileScreen 구현**

`src/features/profile/ProfileScreen.tsx`:

```typescript
import React from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

interface SettingRow {
  id: string;
  label: string;
  value?: string;
  toggle?: boolean;
  danger?: boolean;
  onPress?: () => void;
}

interface SettingSection {
  title: string;
  data: SettingRow[];
}

export function ProfileScreen(): React.ReactElement {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);

  const onLogoutPress = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: () => { void logout(); },
        },
      ],
    );
  };

  const sections: SettingSection[] = [
    {
      title: '사용자 정보',
      data: [
        { id: 'name', label: '이름', value: session?.user.name ?? '-' },
        { id: 'employee', label: '사번', value: session?.user.id ?? '-' },
        { id: 'dept', label: '부서', value: session?.user.department ?? '-' },
      ],
    },
    {
      title: '보안',
      data: [
        { id: 'biometric', label: 'Face ID / 지문 잠금', toggle: true },
        { id: 'autolock', label: '자동 잠금', value: '1분 후' },
      ],
    },
    {
      title: '동기화',
      data: [
        { id: 'wifionly', label: 'Wi-Fi에서만 업로드', toggle: true },
        { id: 'background', label: '백그라운드 업로드', toggle: true },
      ],
    },
    {
      title: '알림',
      data: [
        { id: 'notify_done', label: '전사 완료 알림', toggle: true },
        { id: 'notify_fail', label: '업로드 실패 알림', toggle: true },
      ],
    },
    {
      title: '데이터 관리',
      data: [
        { id: 'retention', label: '녹음 보관 기간', value: '30일' },
        { id: 'cache', label: '캐시 비우기', onPress: () => {} },
      ],
    },
    {
      title: '앱 정보',
      data: [
        { id: 'version', label: '버전', value: '0.1.0' },
        { id: 'terms', label: '이용약관', onPress: () => {} },
        { id: 'privacy', label: '개인정보처리방침', onPress: () => {} },
        { id: 'logout', label: '로그아웃', danger: true, onPress: onLogoutPress },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{session?.user.name?.[0] ?? '?'}</Text>
        </View>
        <View>
          <Text style={styles.userName}>{session?.user.name ?? '사용자'}</Text>
          <Text style={styles.userSub}>{session?.user.department ?? ''}</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={item.onPress}
            disabled={!item.onPress && !item.toggle}
            accessibilityRole={item.toggle ? 'switch' : 'button'}
          >
            <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
              {item.label}
            </Text>
            {item.toggle ? (
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ true: colors.accentBlue }}
              />
            ) : item.value ? (
              <Text style={styles.rowValue}>{item.value}</Text>
            ) : (
              <Text style={styles.rowArrow}>›</Text>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  userName: { ...typography.heading, color: colors.textPrimary },
  userSub: { ...typography.body, color: colors.textSecondary },

  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  sectionTitle: { ...typography.label, color: colors.textSecondary },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowLabelDanger: { color: colors.dangerRed },
  rowValue: { ...typography.body, color: colors.textSecondary },
  rowArrow: { fontSize: 20, color: colors.textSecondary },

  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: spacing.lg },
  listContent: { paddingBottom: 40 },
});
```

- [ ] **Step 5: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/features/profile/ProfileScreen.tsx __tests__/profileLogout.test.ts
git commit -m "feat: ProfileScreen 구현 + 로그아웃 플로우 테스트"
```

---

## Task 9: RecordingScreen (기본 UI)

**Files:**
- Create: `src/features/recording-session/RecordingScreen.tsx`

- [ ] **Step 1: RecordingScreen 구현**

`src/features/recording-session/RecordingScreen.tsx`:

```typescript
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../../theme/tokens';

// 타이머 포맷: 초 → MM:SS
function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function RecordingScreen(): React.ReactElement {
  const navigation = useNavigation();
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [title, setTitle] = useState('');

  // 파형 애니메이션 (5개 막대)
  const waveAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  // 타이머
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setElapsed((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  // 파형 루프 애니메이션
  useEffect(() => {
    if (isPaused) return;
    const animations = waveAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 300 + i * 80,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isPaused, waveAnims]);

  const onStop = () => setSaveModalVisible(true);
  const onSave = () => {
    setSaveModalVisible(false);
    navigation.goBack();
    // 실제 저장 로직은 추후 구현
  };
  const onCancelSave = () => setSaveModalVisible(false);

  return (
    <View style={styles.container}>
      {/* 닫기 버튼 */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
        accessibilityLabel="녹음 취소"
      >
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      {/* 타이머 */}
      <Text style={styles.timer}>{formatTimer(elapsed)}</Text>
      <Text style={styles.timerLabel}>{isPaused ? '일시정지' : '녹음 중'}</Text>

      {/* 파형 */}
      <View style={styles.waveform}>
        {waveAnims.map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.wavebar,
              { transform: [{ scaleY: anim }] },
            ]}
          />
        ))}
      </View>

      {/* 컨트롤 */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setIsPaused((p) => !p)}
          accessibilityLabel={isPaused ? '녹음 재개' : '일시정지'}
        >
          <Text style={styles.pauseBtnText}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stopBtn}
          onPress={onStop}
          accessibilityLabel="녹음 정지"
        >
          <View style={styles.stopIcon} />
        </TouchableOpacity>
      </View>

      {/* 저장 Modal */}
      <Modal
        visible={saveModalVisible}
        animationType="slide"
        transparent
        onRequestClose={onCancelSave}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>녹음 저장</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder={`녹음 ${new Date().toLocaleDateString('ko-KR')}`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onCancelSave}>
                <Text style={styles.modalCancelText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={onSave}>
                <Text style={styles.modalSaveText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeBtn: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, color: colors.textSecondary },

  timer: { fontSize: 56, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  timerLabel: { ...typography.label, color: colors.recordingRed, marginTop: spacing.sm },

  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing['3xl'],
    height: 80,
  },
  wavebar: {
    width: 6,
    height: 60,
    borderRadius: 3,
    backgroundColor: colors.recordingRed,
    opacity: 0.8,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xl'],
  },
  pauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtnText: { fontSize: 22, color: colors.textPrimary },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg },
  titleInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalButtons: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { ...typography.heading, color: colors.textSecondary },
  modalSaveBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: { ...typography.heading, color: '#fff' },
});
```

- [ ] **Step 2: 전체 테스트 통과 확인**

```bash
npm test
```

Expected: 전체 PASS

- [ ] **Step 3: 커밋**

```bash
git add src/features/recording-session/RecordingScreen.tsx
git commit -m "feat: RecordingScreen 기본 UI (타이머/파형/정지/저장 시트)"
```

---

## Task 10: 최종 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
npm test
```

Expected: 전체 PASS. 테스트 목록:
- `mockSsoProvider.test.ts` (기존)
- `statusBadge.test.ts` (기존)
- `tokenStorage.test.ts` (기존)
- `uploadQueue.test.ts` (기존)
- `uploadQueueStore.test.ts` (기존)
- `authGate.test.ts` (신규)
- `customTabBar.test.ts` (신규)
- `searchStore.test.ts` (신규)
- `profileLogout.test.ts` (신규)

- [ ] **Step 2: TypeScript 타입 검사**

```bash
npx tsc --noEmit
```

Expected: 에러 0건

- [ ] **Step 3: 최종 커밋**

```bash
git add -A
git commit -m "feat: BottomTabs + 컷아웃 FAB 네비게이션 + Search/Library/Profile/RecordingScreen 구현 완료"
```
