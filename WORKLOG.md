# WORKLOG

FCord-mobile 작업 내역을 날짜별로 기록합니다.

---

## 2026-06-05

- [fix] 회의록 생성 완료 후 모바일에서 여전히 "생성중"으로 표시되는 상태 동기화 버그 수정 (4건)
  - `src/api/recordings.ts` — `FaicordMeetingItem`에 `statusCode` 필드 추가
    - `GET /api/meetings` 응답에 statusCode가 없어 `toCache()`가 모든 항목을 `'completed'`로 하드코딩하던 문제 제거
    - 백엔드 `MeetingInfoResponse`에 statusCode 추가 후 `mapStatusCode(item.statusCode)`로 정확한 상태 반영
  - `src/api/recordings.ts` — `toCache()`: `transcriptionState: 'completed'` 하드코딩 → `mapStatusCode(item.statusCode ?? null)` 교체
  - `src/api/recordings.ts` — `mapStatusCode()`: `-001`~`-004` 오류 코드가 `'processing'`으로 잘못 매핑되던 버그 수정 (`startsWith('-')` 조건 추가 → `'failed'`)
  - `src/features/recordings/recordingListScreen.tsx` — navigation focus 리스너 추가
    - RecordingScreen에서 녹음 후 돌아올 때 `loadList()` 미호출로 상태가 갱신되지 않던 문제 해결
  - `src/features/recordings/recordingListScreen.tsx` — 폴링 즉시 1회 실행 추가
    - `setInterval(poll, 30_000)`은 첫 실행이 30초 후여서 서버 완료 후 최대 30초 지연 발생 → `poll()` 즉시 호출로 해결
  - FAICord-Back `MeetingInfoResponse.java`: `statusCode` 필드 추가 (getter/builder 포함)
  - FAICord-Back `MeetingService.java` — `convertToMeetingInfoResponse()`: `statusCode` 필드 채우도록 수정

- [fix] `softDeleteRecording()` 스텁 → 실제 백엔드 DELETE 연동
  - `src/api/recordings.ts` — `softDeleteRecording()`: no-op 스텁에서 `DELETE /api/meetings/{id}` 호출로 구현
    - 백엔드 엔드포인트는 이미 완성돼 있었으나 모바일 측 호출 코드가 TODO 스텁으로 비어 있어 삭제 버튼을 눌러도 서버에 반영되지 않던 문제
    - 목록/상세 화면의 Optimistic UI(removeItem → API 호출 → 실패 시 restoreItem 롤백) 패턴은 이미 올바르게 구현돼 있었음
    - `apiRequest`가 `Cookie: sessionid=<token>` 헤더를 자동 포함하므로 인증 별도 처리 불필요

## 2026-06-01

- [fix] FAICORD 백엔드 연동 버그 3건 수정
  - `src/api/recordings.ts` — `uploadRecording()`: FormData 필드명 `file` → `audioFile`
    - 백엔드 `POST /api/meetings/upload`의 `@RequestPart(value = "audioFile")`과 불일치로 파일이 null 처리돼 파이프라인(STT/요약) 미실행
  - `src/api/recordings.ts` — `uploadRecording()`: `startDateTime` 자동 생성 후 FormData에 추가
    - 날짜 미전송 시 서버 `startTime = null` → `date: ""` 응답 → `MinutesPage` 클라이언트 필터(`date < "2026-01-01"`) 탈락으로 목록 미표시
    - 통계(StatsPage total)에는 카운트되나 회의록 목록에 안 보이는 증상의 원인
  - `src/api/client.ts` — `apiRequest()`: `Cookie: sessionid=${token}` 헤더 추가
    - React Native는 서버 Set-Cookie를 쿠키 자동 재전송하지 않음
    - 백엔드 인증이 `sessionid` 쿠키 전용이므로 `apiRequest` 호출 전체가 401 반환
    - `apiUpload()`는 이미 동일 처리 중이었으나 `apiRequest()`에 누락돼 있었음
  - `src/features/recording-session/RecordingScreen.tsx` — `uploadRecording()` 호출 시 `resolvedTitle` 인자 추가
