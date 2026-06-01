# WORKLOG

FCord-mobile 작업 내역을 날짜별로 기록합니다.

---

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
