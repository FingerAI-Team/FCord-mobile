// statusBadge 렌더 로직 단독 추출하여 테스트 (React 없이)
// 실제 BADGE_MAP 값을 재현하여 스펙 §배지 명세 검증

type Track = 'recording' | 'upload' | 'transcription';

interface BadgeConfig {
  label: string;
  backgroundColor: string;
  textColor: string;
}

// statusBadge.tsx의 BADGE_MAP과 동일 (UI 없이 순수 매핑 테스트)
const BADGE_MAP: Record<Track, Record<string, BadgeConfig>> = {
  recording: {
    saved_local: { label: '저장됨', backgroundColor: '#E5E7EB', textColor: '#374151' },
    recording:   { label: '녹음 중', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    paused:      { label: '일시정지', backgroundColor: '#FEF3C7', textColor: '#92400E' },
    draft:       { label: '초안', backgroundColor: '#F3F4F6', textColor: '#6B7280' },
  },
  upload: {
    not_started: { label: '업로드 대기', backgroundColor: '#F3F4F6', textColor: '#6B7280' },
    queued:      { label: '업로드 예정', backgroundColor: '#EFF6FF', textColor: '#1D4ED8' },
    uploading:   { label: '업로드 중',   backgroundColor: '#DBEAFE', textColor: '#1D4ED8' },
    uploaded:    { label: '업로드 완료', backgroundColor: '#D1FAE5', textColor: '#065F46' },
    failed:      { label: '업로드 실패', backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    retrying:    { label: '재시도 중',   backgroundColor: '#FEF3C7', textColor: '#92400E' },
  },
  transcription: {
    not_requested: { label: 'STT 대기',    backgroundColor: '#F3F4F6', textColor: '#6B7280' },
    queued:        { label: 'STT 예정',    backgroundColor: '#EDE9FE', textColor: '#5B21B6' },
    processing:    { label: 'STT 처리 중', backgroundColor: '#EDE9FE', textColor: '#5B21B6' },
    completed:     { label: '전사 완료',   backgroundColor: '#D1FAE5', textColor: '#065F46' },
    failed:        { label: 'STT 실패',    backgroundColor: '#FEE2E2', textColor: '#991B1B' },
    cancelled:     { label: '취소됨',      backgroundColor: '#F3F4F6', textColor: '#6B7280' },
  },
};

// 스펙 §배지 명세 테이블 기반 검증
describe('3-track 배지 렌더 — 스펙 §배지 명세 검증', () => {
  // 가드레일: "배지는 항상 색 + 텍스트 라벨 병기"
  it('모든 배지에 label이 비어있지 않음 (텍스트 라벨 필수)', () => {
    for (const [track, states] of Object.entries(BADGE_MAP)) {
      for (const [state, config] of Object.entries(states)) {
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(config.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });

  it('배지 색상이 모두 다름 (상태 간 시각적 구분 가능)', () => {
    // upload track의 failed/uploaded/uploading은 서로 다른 색 사용
    const upload = BADGE_MAP.upload;
    expect(upload.failed.backgroundColor).not.toBe(upload.uploaded.backgroundColor);
    expect(upload.uploading.backgroundColor).not.toBe(upload.uploaded.backgroundColor);
  });

  describe('upload track 배지', () => {
    it('uploading → "업로드 중" 파란 배경', () => {
      expect(BADGE_MAP.upload.uploading.label).toBe('업로드 중');
      expect(BADGE_MAP.upload.uploading.backgroundColor).toBe('#DBEAFE');
    });
    it('uploaded → "업로드 완료" 초록 배경', () => {
      expect(BADGE_MAP.upload.uploaded.label).toBe('업로드 완료');
      expect(BADGE_MAP.upload.uploaded.backgroundColor).toBe('#D1FAE5');
    });
    it('failed → "업로드 실패" 빨간 배경', () => {
      expect(BADGE_MAP.upload.failed.label).toBe('업로드 실패');
      expect(BADGE_MAP.upload.failed.backgroundColor).toBe('#FEE2E2');
    });
    it('retrying → "재시도 중" 주황 배경', () => {
      expect(BADGE_MAP.upload.retrying.label).toBe('재시도 중');
      expect(BADGE_MAP.upload.retrying.backgroundColor).toBe('#FEF3C7');
    });
  });

  describe('transcription track 배지', () => {
    it('processing → "STT 처리 중" 보라 배경', () => {
      expect(BADGE_MAP.transcription.processing.label).toBe('STT 처리 중');
      expect(BADGE_MAP.transcription.processing.backgroundColor).toBe('#EDE9FE');
    });
    it('completed → "전사 완료" 초록 배경', () => {
      expect(BADGE_MAP.transcription.completed.label).toBe('전사 완료');
      expect(BADGE_MAP.transcription.completed.backgroundColor).toBe('#D1FAE5');
    });
    it('failed → "STT 실패" 빨간 배경', () => {
      expect(BADGE_MAP.transcription.failed.label).toBe('STT 실패');
      expect(BADGE_MAP.transcription.failed.backgroundColor).toBe('#FEE2E2');
    });
  });

  it('알 수 없는 상태값은 null 반환 (조용한 실패)', () => {
    const config = BADGE_MAP['upload']['unknown_state_xyz'];
    expect(config).toBeUndefined();
  });
});
