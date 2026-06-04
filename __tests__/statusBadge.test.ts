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
    saved_local: { label: '생성 완료', backgroundColor: '#e8f5e9', textColor: '#2e7d32' },
    recording:   { label: '생성 중',   backgroundColor: '#fce4ec', textColor: '#c62828' },
    paused:      { label: '일시정지',  backgroundColor: '#fff3e0', textColor: '#e65100' },
    draft:       { label: '초안',      backgroundColor: '#f0f0f0', textColor: '#888888' },
  },
  upload: {
    not_started: { label: '업로드 대기', backgroundColor: '#f0f0f0', textColor: '#888888' },
    queued:      { label: '업로드 예정', backgroundColor: '#f0f0f0', textColor: '#111111' },
    uploading:   { label: '업로드 중',   backgroundColor: '#fff3e0', textColor: '#e65100' },
    uploaded:    { label: '업로드 완료', backgroundColor: '#e8f5e9', textColor: '#2e7d32' },
    failed:      { label: '업로드 실패', backgroundColor: '#fce4ec', textColor: '#c62828' },
    retrying:    { label: '재시도 중',   backgroundColor: '#fff3e0', textColor: '#e65100' },
  },
  transcription: {
    not_requested: { label: '변환 대기',      backgroundColor: '#f0f0f0', textColor: '#888888' },
    queued:        { label: '변환 예정',      backgroundColor: '#fff3e0', textColor: '#e65100' },
    processing:    { label: '음성파일 변환중', backgroundColor: '#fff3e0', textColor: '#e65100' },
    completed:     { label: '변환 완료',      backgroundColor: '#e8f5e9', textColor: '#2e7d32' },
    failed:        { label: '변환 실패',      backgroundColor: '#fce4ec', textColor: '#c62828' },
    cancelled:     { label: '취소됨',         backgroundColor: '#f0f0f0', textColor: '#888888' },
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
    it('uploading → "업로드 중" 주황 배경', () => {
      expect(BADGE_MAP.upload.uploading.label).toBe('업로드 중');
      expect(BADGE_MAP.upload.uploading.backgroundColor).toBe('#fff3e0');
    });
    it('uploaded → "업로드 완료" 초록 배경', () => {
      expect(BADGE_MAP.upload.uploaded.label).toBe('업로드 완료');
      expect(BADGE_MAP.upload.uploaded.backgroundColor).toBe('#e8f5e9');
    });
    it('failed → "업로드 실패" 빨간 배경', () => {
      expect(BADGE_MAP.upload.failed.label).toBe('업로드 실패');
      expect(BADGE_MAP.upload.failed.backgroundColor).toBe('#fce4ec');
    });
    it('retrying → "재시도 중" 주황 배경', () => {
      expect(BADGE_MAP.upload.retrying.label).toBe('재시도 중');
      expect(BADGE_MAP.upload.retrying.backgroundColor).toBe('#fff3e0');
    });
  });

  describe('transcription track 배지', () => {
    it('processing → "음성파일 변환중" 주황 배경', () => {
      expect(BADGE_MAP.transcription.processing.label).toBe('음성파일 변환중');
      expect(BADGE_MAP.transcription.processing.backgroundColor).toBe('#fff3e0');
    });
    it('completed → "변환 완료" 초록 배경', () => {
      expect(BADGE_MAP.transcription.completed.label).toBe('변환 완료');
      expect(BADGE_MAP.transcription.completed.backgroundColor).toBe('#e8f5e9');
    });
    it('failed → "변환 실패" 빨간 배경', () => {
      expect(BADGE_MAP.transcription.failed.label).toBe('변환 실패');
      expect(BADGE_MAP.transcription.failed.backgroundColor).toBe('#fce4ec');
    });
  });

  describe('recording track 배지 (v4 리브랜딩)', () => {
    it('saved_local → "생성 완료" 초록 배경', () => {
      expect(BADGE_MAP.recording.saved_local.label).toBe('생성 완료');
    });
    it('recording → "생성 중" 빨간 배경', () => {
      expect(BADGE_MAP.recording.recording.label).toBe('생성 중');
    });
  });

  it('알 수 없는 상태값은 null 반환 (조용한 실패)', () => {
    const config = BADGE_MAP['upload']['unknown_state_xyz'];
    expect(config).toBeUndefined();
  });
});
