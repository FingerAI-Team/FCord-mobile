// RecordingScreen 저장 로직 — 순수 함수 단위 테스트
// buildSavePayload: 제목 + 경과시간 → API 요청 바디
// buildOptimisticItem: API 응답 id → 목록에 바로 추가할 낙관적 아이템

import { buildSavePayload, buildOptimisticItem } from '../src/features/recording-session/recordingSessionUtils';

describe('buildSavePayload', () => {
  it('경과 시간(초)을 duration_ms(밀리초)로 변환한다', () => {
    const payload = buildSavePayload('회의 녹음', 90);
    expect(payload.duration_ms).toBe(90_000);
  });

  it('제목이 비어있으면 오늘 날짜 기반 기본 제목을 사용한다', () => {
    const payload = buildSavePayload('', 30);
    expect(payload.title).toMatch(/녹음 \d{4}/); // "녹음 YYYY..." 형식
  });

  it('제목이 있으면 trim한 값을 사용한다', () => {
    const payload = buildSavePayload('  주간 미팅  ', 60);
    expect(payload.title).toBe('주간 미팅');
  });
});

describe('buildOptimisticItem', () => {
  it('3-track 초기 상태: recordingState=saved_local, uploadState=queued, transcriptionState=not_requested', () => {
    const item = buildOptimisticItem('rec-001', '주간 미팅', 60);
    expect(item.recordingState).toBe('saved_local');
    expect(item.uploadState).toBe('queued');
    expect(item.transcriptionState).toBe('not_requested');
  });

  it('id와 title이 그대로 반영된다', () => {
    const item = buildOptimisticItem('rec-123', '현장 인터뷰', 120);
    expect(item.id).toBe('rec-123');
    expect(item.title).toBe('현장 인터뷰');
  });

  it('durationMs가 elapsed(초) × 1000이다', () => {
    const item = buildOptimisticItem('rec-001', '테스트', 45);
    expect(item.durationMs).toBe(45_000);
  });

  it('tags는 빈 배열이다', () => {
    const item = buildOptimisticItem('rec-001', '테스트', 10);
    expect(item.tags).toEqual([]);
  });
});
