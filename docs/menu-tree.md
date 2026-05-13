# 메뉴 트리 — 2026 트렌드 반영판

> 마지막 업데이트: 2026-05-08
> 참조: `CLAUDE.md`, `docs/spec.md`

## 적용한 트렌드 (요약)

- **Bottom Tab + Center FAB**: 한 손 거리 핵심 액션, 단일 스택 → 멀티 탭
- **Bottom Sheet 우선**: 풀모달은 위험/비가역 액션에만
- **Just-in-time 권한 + 가치 설명 프라이머**: 콜드 권한 요청 금지
- **Biometric Unlock**: 최초 1회 SSO → 이후 Face ID/지문
- **Optimistic UI + Undo Toast**: 삭제/보관 즉시 반영, 5초 내 되돌리기
- **Swipe Gestures**: 카드 좌우 스와이프 액션
- **Haptic Feedback**: 녹음 시작/정지/완료 단계별
- **Skeleton Loader**: 스피너 대신
- **AI Summary 자리 확보**: STT 앱 시장 표준
- **3-track 상태 라벨 병기**: 색만으로 상태 표시 금지 (가드레일 준수)

## 인증 정책 (확정 2026-05-08)

- 1차: **MockSSOProvider**로 가상 로그인 동작
- 2차: **IBKSSOProvider** (IBK투자증권 SSO 연동, 추후 교체)
- 어댑터: `src/auth/providers/*` — 인터페이스 동일, 구현만 교체
- 토큰 저장: `react-native-keychain` (가드레일: 평문 저장 금지)

## 전체 트리

```
App.tsx
│
├── [부팅] AuthGate                          토큰/세션 + Biometric 잠금
│   ├── 미인증 → AuthStack
│   └── 인증   → MainStack
│
├── AuthStack
│   ├── SplashScreen                         1초 브랜드 + 자동 라우팅
│   ├── OnboardingCarouselScreen             3장, 스킵 가능
│   ├── PermissionPrimerScreen               마이크/알림 가치 설명 → JIT 요청
│   │   └── PermissionDeniedSheet            거부 시 설정 딥링크
│   ├── LoginScreen                          IBK SSO 버튼 + 사번/비번 fallback (mock)
│   │   ├── SSORedirectInProgress            IdP 콜백 대기
│   │   └── LoginErrorSheet                  실패 사유 + 재시도
│   └── BiometricEnrollScreen                최초 1회 Face ID/지문 (스킵 가능)
│
├── MainStack
│   │
│   ├── BottomTabs
│   │   ├── HomeTab        → RecordingListScreen
│   │   ├── SearchTab      → SearchScreen          [신규]
│   │   ├── [Center FAB]   → RecordingScreen
│   │   ├── LibraryTab     → LibraryScreen         [신규]
│   │   └── ProfileTab     → ProfileScreen         [신규]
│   │
│   ├── RecordingListScreen (Home)
│   │   ├── GreetingHeader                   "오늘 회의 N건" 컨텍스트
│   │   ├── SegmentedFilter                  전체 / 업로드중 / 완료 / 실패
│   │   ├── SortChip                         Bottom Sheet로 선택
│   │   ├── PullToRefresh
│   │   ├── RecordingCard (Swipe enabled)
│   │   │   ├── StatusBadgeRow (3-track)     아이콘 + 텍스트 라벨
│   │   │   ├── Swipe Left  → ArchiveAction
│   │   │   ├── Swipe Right → DeleteAction (Undo 토스트)
│   │   │   ├── LongPress   → MultiSelectMode
│   │   │   └── Tap         → RecordingDetailScreen
│   │   ├── EmptyStateView                   일러스트 + CTA
│   │   ├── BulkActionBar                    보관/삭제/태그
│   │   └── DeleteConfirmSheet
│   │
│   ├── SearchScreen [신규]
│   │   ├── SearchBar (autofocus, 보이스)
│   │   ├── RecentQueriesChips
│   │   ├── ResultTabs                       제목 / 본문 / 메모
│   │   ├── ResultCard (하이라이트 + 타임스탬프)
│   │   └── 결과 → TranscriptScreen(?t=01:23)
│   │
│   ├── LibraryScreen [신규]
│   │   ├── 즐겨찾기 / 보관함 / 태그별 그룹
│   │   └── 태그 편집 Sheet
│   │
│   ├── ProfileScreen [신규]
│   │   ├── 사용자 정보 (사번, 부서)
│   │   ├── 보안                             Biometric 토글, 자동 잠금
│   │   ├── 동기화                           Wi-Fi 전용, 백그라운드 업로드
│   │   ├── 알림 설정
│   │   ├── 데이터 관리                      보관 정책, 캐시 비우기
│   │   ├── 약관/개인정보처리방침
│   │   └── 로그아웃 (확인 Sheet)
│   │
│   ├── RecordingScreen (Center FAB)
│   │   ├── LiveWaveform                     파형 + 타이머
│   │   ├── DeviceLevelMeter                 dB + 라벨
│   │   ├── PauseResumeButton (Haptic)
│   │   ├── StopButton                       → SaveSheet
│   │   ├── QuickNoteInput                   녹음 중 메모
│   │   └── SaveSheet                        제목/태그 → Detail로 이동
│   │
│   ├── RecordingDetailScreen
│   │   ├── HeroHeader                       제목(인라인 수정), 날짜, 길이
│   │   ├── StatusTrackRow × 3               recording / upload / transcription
│   │   ├── UploadProgressBar
│   │   ├── ActionGroup (조건부)
│   │   │   ├── RetryUploadButton           upload failed
│   │   │   ├── RetryTranscriptionButton    transcription failed
│   │   │   └── RequestTranscriptionButton  uploaded + not_requested
│   │   ├── PlayerBar                        재생/스크럽 (Transcript 동기)
│   │   ├── MemoSection (인라인 + 자동 저장)
│   │   ├── [전사결과] → TranscriptScreen
│   │   ├── ShareSheet                       내보내기 (사내 정책 체크)
│   │   └── DangerZoneSheet                  삭제/보관/재처리 분리
│   │
│   ├── TranscriptScreen [정식화]
│   │   ├── Header                           화자 토글, 타임스탬프
│   │   ├── TranscriptList (가상 스크롤)
│   │   │   ├── SpeakerSegment (탭 → 오디오 점프)
│   │   │   └── 인라인 편집 모드
│   │   ├── HighlightToolbar                 형광펜/북마크
│   │   ├── AISummarySection [옵션, 추후]    요약/액션아이템/키워드
│   │   ├── ExportSheet                      TXT/MD/SRT/VTT
│   │   └── SearchInTranscript               본문 내 검색
│   │
│   └── 공통 컴포넌트
│       ├── BottomSheetHost
│       ├── ToastWithUndo
│       ├── SkeletonLoader
│       ├── HapticController
│       └── ThemeProvider (Light/Dark/System)
```

## 화면 매트릭스 (구현 우선순위)

| 화면 | 우선순위 | 구현 상태 |
| --- | --- | --- |
| SplashScreen | P0 | 신규 (이번 PR) |
| LoginScreen (mock SSO) | P0 | 신규 (이번 PR) |
| AuthGate | P0 | 신규 (이번 PR) |
| RecordingListScreen | P0 | 기존, 트렌드 적용 필요 |
| RecordingScreen | P0 | 미구현 |
| RecordingDetailScreen | P0 | 기존, 액션 분리 보강 필요 |
| TranscriptScreen | P1 | 미구현 |
| OnboardingCarouselScreen | P1 | 미구현 |
| PermissionPrimerScreen | P1 | 미구현 |
| BiometricEnrollScreen | P1 | 미구현 |
| SearchScreen | P2 | 미구현 |
| LibraryScreen | P2 | 미구현 |
| ProfileScreen | P2 | 미구현 |

## 변경 사항 요약 (vs 이전 트리)

| 분류 | 이전 | 변경 |
| --- | --- | --- |
| 진입 | RecordingList 직진 | AuthGate → Auth/Main 분기 |
| 인증 | 없음 | SSO + Biometric + 권한 프라이머 |
| 네비게이션 | Stack only | BottomTabs + Center FAB |
| 신규 화면 | — | Search / Library / Profile / Onboarding / Login / Permission / BiometricEnroll |
| 모달 | DeleteConfirmModal | 전부 Bottom Sheet (Delete/Sort/Share/Export/Logout) |
| 카드 인터랙션 | 탭만 | Swipe + Long-press 다중선택 |
| 상태 표시 | StatusBadge × 3 | 아이콘 + 텍스트 라벨 병기 |
| Transcript | 미구현 | 화자/하이라이트/검색/Export 정식화 |
| 액션 분리 | 재전송/재처리/STT 요청 혼재 | ActionGroup으로 명시 분리 |
| 삭제 | Confirm 모달 | Optimistic + Undo 토스트 |
