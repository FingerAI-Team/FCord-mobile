# ibk_stt — 프로젝트 컨텍스트

## 한 줄 정의

사내 직원이 폰에서 음성을 녹음 → 서버 업로드 → 외부 STT 모델 처리 결과를 모바일에서 조회·편집·검색하는 모바일 앱.

## 산출 범위

- **IN**: 모바일 앱 UI/UX, 모바일 ↔ 서버 API contract, 로컬 데이터 모델, 상태기계
- **OUT**: STT 엔진 (외부, 갈아끼울 수 있는 어댑터 뒤), 서버 인프라/배포, 백엔드 워커 내부 구현

## 사용자 / 사용 시점

- IBK 사내 직원 (B2B internal)
- 회의·인터뷰·현장 메모 캡처

## 기술 스택 (확정)

- 모바일: **React Native + TypeScript** (cross-platform 1 코드베이스)
- 상태: Zustand 또는 RTK Query
- 로컬 DB: WatermelonDB 또는 op-sqlite
- 녹음: expo-av 또는 react-native-audio-recorder-player
- 백그라운드 업로드: react-native-background-upload
- 보안 저장소: react-native-keychain

## 핵심 설계 원칙

1. **3-track 상태 분리**: `recording_state` / `upload_state` / `transcription_state` 절대 합치지 않는다.
2. **재전송 ≠ 재처리**: 다른 버튼, 다른 의미.
3. **provider-agnostic transcript schema**: STT 모델이 바뀌어도 앱은 동일 결과 스키마만 본다.
4. **batch-first**: 실시간 STT는 MVP 범위 밖.
5. **오프라인 캡처 항상 가능**: 녹음·로컬 저장은 네트워크 무관, 업로드만 큐잉.

## FAICORD 백엔드 연동 규칙 (faicord.fingerservice.co.kr)

### 인증

- 백엔드는 **`sessionid` 쿠키 전용** 인증 (`SessionInterceptor` — `token` 헤더 미지원)
- React Native의 `fetch`는 서버 Set-Cookie를 자동 재전송하지 않으므로, 모든 인증 요청(`apiRequest` / `apiUpload`)에 **반드시 `Cookie: sessionid=${token}` 헤더를 수동 설정**해야 한다
- `token`은 로그인 응답의 `data.token` 값 = 서버 세션 UUID = `sessionid` 쿠키 값 (동일)

### 업로드 (`POST /api/meetings/upload`)

- 오디오 파일은 FormData 필드명 **`audioFile`** 로 전송 (`file` 이름 사용 금지 — 서버가 null 처리)
- **`startDateTime`을 반드시 포함** (`"yyyy-MM-dd HH:mm"` 형식, 서버 파싱 포맷 일치)
  - 누락 시 서버가 `startTime = null`로 저장 → API 응답 `date: ""` → 웹 MinutesPage 날짜 필터 탈락으로 목록 미표시
- `title`은 선택 파라미터 (`@RequestPart(required = false)`)

### 주요 엔드포인트

| 용도 | 메서드 | 경로 |
|------|--------|------|
| 회의 목록 | GET | `/api/meetings` |
| 회의록 목록 (요약 완료 포함 전체) | GET | `/api/meetings/minutes` |
| 음성 업로드 + 회의 생성 | POST | `/api/meetings/upload` |
| 전사 결과 조회 | GET | `/api/meetings/transcript/{id}` |
| 요약 재처리 | POST | `/api/meetings/transcript/{id}/regenerate` |

---

## 가드레일 (하면 안 되는 것)

- STT provider 직접 호출 금지 (서버 어댑터 경유)
- 토큰 평문 저장 금지 (Keychain/Keystore 필수)
- 3-track 상태 단일 컬럼으로 합치기 금지
- 재전송/재처리 한 버튼으로 묶기 금지
- 색만으로 상태 표시 금지 (라벨 병기)
- pre-check 된 약관 동의 금지 (개인정보보호법)
- 사용자 명시 액션 없이 녹음 자동 시작 금지

## 현재 스프린트 / 다음 작업

- [ ] spec.md 디자인 확정 (TBD 항목 클로즈)
- [ ] 트렌드 반영 메뉴 트리 → 화면별 Stitch 프롬프트 → Figma (`docs/menu-tree.md` 기반)
- [ ] 서버팀과 API contract 합의 (OpenAPI 스펙 픽스)
- [x] 인증 1차: MockSSOProvider 가상 로그인 (`src/auth/`)
- [ ] 인증 2차: IBKSSOProvider 실제 연동 (IBK투자증권 SSO 사양 수령 후)
- [ ] STT 모델 호스팅 위치 확인 (국외이전 동의 필요 여부)
- [ ] React Native 프로젝트 CI 셋업
- [ ] BottomTabs + Center FAB 네비게이션 도입
- [ ] Search / Library / Profile 신규 화면 P2 구현

## 의사결정 로그

| 일자 | 결정 | 사유 |
| --- | --- | --- |
| 2026-05-08 | 플랫폼: React Native cross-platform | 1 코드베이스, MVP 속도 우선 |
| 2026-05-08 | STT는 외부 모델, 앱은 contract만 의존 | 서버측 어댑터 패턴 사용 (벤더 교체 가능) |
| 2026-05-08 | 실시간 STT 제외, batch만 | 정확도/운영 단순성 우선. 두 번째 product 분기 회피 |
| 2026-05-08 | 사용자 타겟: B2B internal (IBK 사내) | 시장 검증 단계 생략, 내부 dogfood 중심 |
| 2026-05-08 | 산출물 1차 범위: 앱 UI/UX + API contract | 백엔드/STT 구현은 외부 책임 |
| 2026-05-08 | 인증 어댑터 패턴: Mock → IBK SSO 교체 가능 구조 | IBK투자증권 SSO 사양 미수령, 1차는 가상 로그인으로 흐름 검증 |
| 2026-05-08 | 메뉴 트리 트렌드 반영판 확정 (`docs/menu-tree.md`) | BottomTabs+FAB, Bottom Sheet, Swipe, Optimistic UI 도입 |

## 검증 가설 (1주일 dogfood)

- 일평균 녹음 ≥ 3건/인 (10명 기준)
- 업로드 실패율 < 5%
- 전사 결과 열람률 > 70%
- 녹음 유실 0건

## TBD (미정 항목)

- IBK투자증권 SSO 정확한 사양 (OIDC/SAML, 콜백 URL, 클라이언트 ID)
- 푸시 알림 정책
- 원본/raw/편집본 retention
- 국외이전 동의 여부
- 접속기록 보관 기간 (1년/2년)

## 참고 문서

- `docs/spec.md` — 전체 기술 스펙
- `docs/menu-tree.md` — 2026 트렌드 반영 화면 트리 (단일 진실)
- 원본 기획서 — `Executive Summary + 사용자 흐름 + STT 벤더 비교 표` 포함 (서버/벤더 결정 시 참조)
