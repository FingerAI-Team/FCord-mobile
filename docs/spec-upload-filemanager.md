# ibk_stt — 업로드 + 파일관리 구현 스펙

> 산출 기준일: 2026-05-08
> 상위 스펙: `docs/spec.md`
> 이번 구현 범위: FR-4 (업로드), FR-5 (3-track 상태), FR-9 (메타 편집), FR-10 (재전송/재처리), FR-11 (목록/필터/정렬), FR-13 (삭제)

---

## 목적

녹음이 완료된 파일을 유실 없이 서버로 전송하고, 전송 상태와 STT 상태를 분리하여 표시하며, 사용자가 파일 목록을 관리할 수 있게 한다.

---

## 기능 요구사항 (이번 구현)

| ID | 기능 | 상세 |
| --- | --- | --- |
| FR-4 | 업로드 | pre-signed multipart 업로드, SHA-256 무결성 검증, 백그라운드 업로드, 자동 재시도 |
| FR-5 | 3-track 상태 배지 | `recording_state` / `upload_state` / `transcription_state` 분리 배지 (색 + 텍스트 라벨 병기) |
| FR-9 | 메타데이터 편집 | title, note, tags, language_hint 수정 (상세 화면에서) |
| FR-10 | 재전송/재처리 분리 | 업로드 실패 → "재전송" 버튼. STT 실패 → "재처리" 버튼. 절대 같은 버튼으로 묶지 않음 |
| FR-11 | 목록/필터/정렬 | 탭: All / Uploading / Done / Failed. 정렬: 최신순/길이순. cursor 기반 페이징 |
| FR-13 | 삭제 | 스와이프 또는 더보기 메뉴 → 확인 모달 → soft delete. 로컬 즉시 숨김, 서버 soft delete |

---

## 비기능 요구사항 (이번 범위)

| 영역 | 기준 |
| --- | --- |
| 신뢰성 | 재시도 backoff: `1s→3s→10s→30s→120s`, 최대 5회. 이후 `upload_state = failed` |
| 멱등성 | `complete` API 중복 호출 시 서버 측 동일 결과 반환. 앱은 무조건 호출 가능 |
| 오프라인 | 네트워크 없을 때 큐에 쌓아두고, 온라인 복귀 시 자동 재개 |
| 백그라운드 | 앱이 백그라운드/종료 상태여도 업로드 진행. 시스템 알림으로 진척 표시 |
| 목록 성능 | 목록 첫 로드 < 1s (50개 기준), 스크롤 FPS ≥ 60 |
| 상태 정합성 | 로컬 DB와 서버 상태 불일치 발생 시 서버 값 우선 (pull-to-refresh 또는 앱 재진입 시 동기화) |

---

## 데이터 모델

### LocalUploadQueue (로컬 DB)

```typescript
interface LocalUploadQueue {
  id: string;                    // UUID
  recording_id: string;          // FK → LocalRecording.id
  upload_session_id?: string;    // 서버 upload-session ID
  presigned_url?: string;        // multipart presigned URL
  presigned_url_expires_at?: number; // UNIX timestamp (만료 감시용)
  bytes_total: number;
  bytes_uploaded: number;
  attempts: number;              // 0부터 시작, max 5
  last_error?: string;
  next_retry_at?: number;        // UNIX timestamp
  status: UploadQueueStatus;
  created_at: number;
  updated_at: number;
}

type UploadQueueStatus =
  | 'pending'    // 큐 등록, 아직 시작 안 함
  | 'uploading'  // 진행 중
  | 'completing' // complete API 호출 중
  | 'done'       // 완료
  | 'failed'     // 5회 소진
  | 'cancelled'; // 사용자 삭제
```

### ServerRecordingCache (로컬 캐시)

```typescript
interface ServerRecordingCache {
  id: string;                         // 서버 recording ID
  title: string;
  note?: string;
  tags: string[];
  language_hint?: string;
  duration_ms?: number;
  file_size_bytes?: number;
  upload_state: UploadState;
  transcription_state: TranscriptionState;
  recording_state: RecordingState;    // 앱 로컬 draft 상태
  created_at: number;
  updated_at: number;
  transcript_preview?: string;        // 첫 200자
  cached_at: number;                  // 캐시 갱신 시각
}

type UploadState =
  | 'not_started' | 'queued' | 'uploading' | 'uploaded' | 'failed' | 'retrying';

type TranscriptionState =
  | 'not_requested' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

type RecordingState =
  | 'draft' | 'recording' | 'paused' | 'saved_local' | 'archived' | 'deleted';
```

---

## API 사용 순서 (Upload Flow)

```
1. POST /v1/recordings
   body: { title, note, tags, language_hint, duration_ms, file_size_bytes }
   → { id: "rec_abc", ... }

2. POST /v1/recordings/{id}/upload-sessions
   body: { file_size_bytes, checksum_sha256 }
   → { upload_session_id: "us_xyz", presigned_url: "...", expires_at: ... }

3. PUT {presigned_url}   ← 직접 스토리지 업로드 (react-native-background-upload)
   header: Content-Type: audio/mp4 (또는 audio/m4a)
   body: binary file

4. POST /v1/upload-sessions/{upload_session_id}/complete
   body: { checksum_sha256, bytes_uploaded }
   → { status: "uploaded" }

5. POST /v1/recordings/{id}/transcriptions
   body: {}   ← provider 필드 미포함 (서버가 라우팅)
   → { transcription_id: "tr_zzz", status: "queued" }
```

### Presigned URL 만료 처리

- `presigned_url_expires_at`이 현재 시각 + 60s 이내면 새 upload-session 재발급 후 재시작
- 만료된 URL로 업로드 중이면 즉시 중단, 재발급 후 처음부터 재시도 (서버 멱등성 보장)

---

## 업로드 큐 상태기계

```
pending
  └─ 네트워크 on / 앱 포그라운드·백그라운드 ──→ uploading
       ├─ 성공 ──→ completing ──→ done
       └─ 실패 & attempts < 5 ──→ retrying (backoff 대기) ──→ uploading (재시도)
               & attempts == 5 ──→ failed
사용자 삭제 (any state) ──→ cancelled
```

---

## UI 화면

### 화면 3: 홈/목록

| 구성 요소 | 명세 |
| --- | --- |
| 상단 탭 | All / Uploading / Done / Failed — 탭 전환 시 필터 즉시 적용 |
| 정렬 버튼 | "최신순" (기본) / "길이순" — 드롭다운 또는 토글 |
| 파일 카드 | 제목, 생성일, 길이, **3-track 배지 3개** (recording / upload / transcription) |
| 업로드 진행률 | `upload_state == uploading`일 때 프로그레스 바 표시 |
| 스와이프 | 좌측 스와이프 → "삭제" 버튼 (빨간색 + "삭제" 텍스트) |
| Pull-to-refresh | 서버 목록 재동기화 |
| 빈 상태 | 탭별 메시지 ("녹음을 시작해보세요" / "업로드 중인 파일 없음" / "완료된 파일 없음" / "실패 파일 없음") |
| 로딩 | 첫 진입 스켈레톤 UI. 추가 로드 하단 스피너 |

**3-track 배지 명세:**

| track | 값 | 배지 텍스트 | 색 |
| --- | --- | --- | --- |
| recording | saved_local | 저장됨 | neutral gray |
| upload | uploading | 업로드 중 | blue |
| upload | uploaded | 업로드 완료 | green |
| upload | failed | 업로드 실패 | red |
| upload | retrying | 재시도 중 | orange |
| transcription | processing | STT 처리 중 | purple |
| transcription | completed | 전사 완료 | green |
| transcription | failed | STT 실패 | red |

→ 배지는 항상 **색 + 텍스트 라벨 병기**. 색만으로 구분 금지.

### 화면 5: 상세/재생 (업로드·파일관리 관련 부분)

| 구성 요소 | 명세 |
| --- | --- |
| 3-track 배지 | 상단 고정 영역에 3개 배지 세로 또는 가로 나열 |
| 재전송 버튼 | `upload_state == failed`일 때만 노출. 라벨: "재전송". 아이콘: 화살표 업 |
| 재처리 버튼 | `transcription_state == failed`일 때만 노출. 라벨: "재처리". 아이콘: 새로고침 |
| 업로드 진행률 | `uploading`일 때 프로그레스 바 + 퍼센트 + 남은 시간 추정 |
| 메타 편집 | title, note, tags, language_hint — 인라인 편집 또는 편집 모달 |
| 삭제 | 우상단 더보기(…) → "삭제" → 확인 모달 |

---

## 상태 변화 시 UI 반응 규칙

| 이벤트 | UI 반응 |
| --- | --- |
| 업로드 시작 | 배지: "업로드 중", 프로그레스 바 나타남 |
| 업로드 성공 | 배지: "업로드 완료", 프로그레스 바 사라짐, 자동으로 STT 요청 |
| 업로드 실패 (재시도 전) | 배지: "재시도 중", 다음 재시도 카운트다운 노출 |
| 업로드 최종 실패 | 배지: "업로드 실패" (빨간), "재전송" 버튼 노출 |
| STT 처리 중 | 배지: "STT 처리 중" (보라), 재처리 버튼 숨김 |
| STT 완료 | 배지: "전사 완료" (초록), "전사 보기" CTA 노출 |
| STT 실패 | 배지: "STT 실패" (빨간), "재처리" 버튼 노출 |
| 소프트 삭제 | 로컬 즉시 숨김, 목록에서 제거, 업로드 큐 cancelled 처리 |

---

## 의존성 / 영향 파일 (신규)

```
src/
  features/
    upload/
      uploadQueue.ts          // 큐 상태기계 + backoff 로직
      uploadService.ts        // presigned URL 발급 + multipart + complete
      useUploadProgress.ts    // 실시간 진행률 훅
    recordings/
      recordingListScreen.tsx // 화면 3 (홈/목록)
      recordingDetailScreen.tsx // 화면 5 (상세) — upload 관련 섹션
      recordingCard.tsx       // 파일 카드 컴포넌트
      statusBadge.tsx         // 3-track 배지 공통 컴포넌트
      retryButtons.tsx        // 재전송/재처리 버튼 (분리)
      filterTabs.tsx          // All/Uploading/Done/Failed 탭
      deleteConfirmModal.tsx  // 삭제 확인 모달
  stores/
    uploadQueueStore.ts       // Zustand 업로드 큐 스토어
    recordingListStore.ts     // 목록 캐시 + 필터/정렬 상태
  db/
    schema.ts                 // WatermelonDB 스키마 (LocalUploadQueue 추가)
    migrations.ts
  api/
    recordings.ts             // GET /v1/recordings, DELETE, PATCH
    uploadSessions.ts         // POST upload-sessions, POST complete
```

---

## 가드레일 (이번 구현)

- `presigned_url` 만료 전 확인 없이 업로드 시작 금지. 항상 `expires_at` 체크 후 재발급 판단.
- 재전송(`upload`) 버튼과 재처리(`transcription`) 버튼 같은 컴포넌트로 통합 금지.
- `upload_state`, `transcription_state`, `recording_state`를 단일 `status` 필드로 합산 금지.
- 삭제 시 서버 요청 성공 전에 로컬 DB 완전 삭제 금지 (soft delete → 확인 후 숨김).
- 배지 색만으로 상태 표시 금지. 텍스트 라벨 필수.
- 업로드 완료 전에 STT 요청 자동 실행 금지 (`upload_state == 'uploaded'` 확인 후).

---

## 검증 기준

| 레이어 | 시나리오 | 합격 기준 |
| --- | --- | --- |
| Unit | uploadQueue backoff 계산 | 5회 후 `failed`, 각 delay 정확 |
| Unit | presigned_url 만료 감지 | expires_at - now < 60s → 재발급 트리거 |
| Unit | SHA-256 checksum 계산 | 파일별 일치 확인 |
| Unit | 3-track 배지 렌더 | 상태값별 올바른 텍스트+색 |
| Integration | 업로드 전체 흐름 | draft 생성 → presigned 발급 → 업로드 → complete → STT 요청 순서 정확 |
| Integration | 재시도 멱등성 | complete API 2회 호출 → 중복 오류 없음 |
| Resilience | 비행기모드 중 녹음 완료 | 온라인 복귀 시 큐 자동 처리 |
| Resilience | 앱 강제종료 후 재진입 | 업로드 큐 상태 유지, 재개 |
| Resilience | presigned URL 만료 후 재시도 | 새 URL 발급 후 재시작 |
| UI | 재전송/재처리 버튼 분리 | 동일 컴포넌트 사용 여부 코드 리뷰로 확인 |
| UI | 배지 텍스트 라벨 | 색 전용 배지 0개 |
| 접근성 | VoiceOver/TalkBack | 배지 + 버튼 라벨 읽힘 |

---

## 후속 단계

구현 완료 후:
1. `security-reviewer` — 토큰 저장·presigned URL 만료 처리 보안 검증
2. `test-writer` — uploadQueue 상태기계 unit 테스트 일괄 생성
3. `code-reviewer` — 재전송/재처리 컴포넌트 분리 여부 확인
