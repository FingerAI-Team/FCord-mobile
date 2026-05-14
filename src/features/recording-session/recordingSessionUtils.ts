import { ServerRecordingCache } from '../../types';

interface SavePayload {
  title: string;
  duration_ms: number;
  file_size_bytes: number;
}

// API 요청 바디 생성 — 빈 제목은 날짜 기반 기본값으로 대체
export function buildSavePayload(title: string, elapsedSeconds: number): SavePayload {
  const trimmed = title.trim();
  return {
    title: trimmed || `녹음 ${new Date().toLocaleDateString('ko-KR')}`,
    duration_ms: elapsedSeconds * 1000,
    file_size_bytes: 0, // 실제 파일 크기는 녹음 모듈 연동 후 채움
  };
}

// 저장 직후 목록에 즉시 반영할 낙관적 아이템 생성 (3-track 초기 상태)
export function buildOptimisticItem(
  id: string,
  title: string,
  elapsedSeconds: number,
): ServerRecordingCache {
  const now = Date.now();
  return {
    id,
    title,
    tags: [],
    durationMs: elapsedSeconds * 1000,
    uploadState: 'queued',
    transcriptionState: 'not_requested',
    recordingState: 'saved_local',
    createdAt: now,
    updatedAt: now,
    cachedAt: now,
  };
}
