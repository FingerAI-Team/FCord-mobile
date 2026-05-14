// RecordingDetailScreen 화면 분기 로직 단위 테스트
// resolveDetailActions: 3-track 상태 → 표시할 액션 결정
// shouldSaveTitle: 제목 변경 여부 검사

import { resolveDetailActions, shouldSaveTitle } from '../src/features/recordings/recordingDetailUtils';
import { ServerRecordingCache } from '../src/types';

// 테스트용 기본 녹음 객체 팩토리
function makeRecording(overrides: Partial<ServerRecordingCache>): ServerRecordingCache {
  const now = Date.now();
  return {
    id: 'rec-001',
    title: '테스트 녹음',
    tags: [],
    uploadState: 'uploaded',
    transcriptionState: 'not_requested',
    recordingState: 'saved_local',
    createdAt: now,
    updatedAt: now,
    cachedAt: now,
    ...overrides,
  };
}

describe('resolveDetailActions', () => {
  describe('업로드 재전송 버튼', () => {
    it('uploadState=failed → 재전송 버튼 표시', () => {
      const r = makeRecording({ uploadState: 'failed' });
      expect(resolveDetailActions(r).showRetryUpload).toBe(true);
    });

    it('uploadState=uploaded → 재전송 버튼 숨김', () => {
      const r = makeRecording({ uploadState: 'uploaded' });
      expect(resolveDetailActions(r).showRetryUpload).toBe(false);
    });
  });

  describe('STT 재처리 버튼', () => {
    it('transcriptionState=failed → 재처리 버튼 표시', () => {
      const r = makeRecording({ transcriptionState: 'failed' });
      expect(resolveDetailActions(r).showRetryTranscription).toBe(true);
    });

    it('transcriptionState=completed → 재처리 버튼 숨김', () => {
      const r = makeRecording({ transcriptionState: 'completed' });
      expect(resolveDetailActions(r).showRetryTranscription).toBe(false);
    });
  });

  describe('전사 시작 버튼 (C2: 업로드 완료 + STT 미요청)', () => {
    it('uploadState=uploaded + transcriptionState=not_requested → 전사 시작 버튼 표시', () => {
      const r = makeRecording({ uploadState: 'uploaded', transcriptionState: 'not_requested' });
      expect(resolveDetailActions(r).showRequestTranscription).toBe(true);
    });

    it('uploadState=uploaded + transcriptionState=queued → 전사 시작 버튼 숨김', () => {
      const r = makeRecording({ uploadState: 'uploaded', transcriptionState: 'queued' });
      expect(resolveDetailActions(r).showRequestTranscription).toBe(false);
    });

    it('uploadState=failed + transcriptionState=not_requested → 전사 시작 버튼 숨김 (업로드 안 됨)', () => {
      const r = makeRecording({ uploadState: 'failed', transcriptionState: 'not_requested' });
      expect(resolveDetailActions(r).showRequestTranscription).toBe(false);
    });
  });

  describe('전사 결과 보기 버튼', () => {
    it('transcriptionState=completed → 전사 결과 보기 표시', () => {
      const r = makeRecording({ transcriptionState: 'completed' });
      expect(resolveDetailActions(r).showViewTranscript).toBe(true);
    });

    it('transcriptionState=processing → 전사 결과 보기 숨김', () => {
      const r = makeRecording({ transcriptionState: 'processing' });
      expect(resolveDetailActions(r).showViewTranscript).toBe(false);
    });
  });
});

describe('shouldSaveTitle', () => {
  it('제목이 변경됐고 비어있지 않으면 저장해야 한다', () => {
    expect(shouldSaveTitle('새 제목', '기존 제목')).toBe(true);
  });

  it('제목이 기존과 동일하면 저장하지 않는다', () => {
    expect(shouldSaveTitle('동일 제목', '동일 제목')).toBe(false);
  });

  it('제목이 비어있으면 저장하지 않는다', () => {
    expect(shouldSaveTitle('', '기존 제목')).toBe(false);
  });

  it('공백만 있는 제목은 저장하지 않는다', () => {
    expect(shouldSaveTitle('   ', '기존 제목')).toBe(false);
  });
});
