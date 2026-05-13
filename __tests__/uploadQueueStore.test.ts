import { useUploadQueueStore, MAX_UPLOAD_ATTEMPTS, MAX_CONCURRENT_UPLOADS } from '../src/stores/uploadQueueStore';

describe('uploadQueueStore — presigned URL 캐시', () => {
  beforeEach(() => {
    // 스토어 초기화
    useUploadQueueStore.setState({
      presignedUrlCache: {},
      progressMap: {},
      isProcessing: false,
      activeUploadIds: [],
    } as Parameters<typeof useUploadQueueStore.setState>[0]);
  });

  it('유효한 URL 저장 후 isPresignedUrlValid = true', () => {
    const sessionId = 'us_test_001';
    useUploadQueueStore.getState().setPresignedUrl(sessionId, {
      uploadSessionId: sessionId,
      presignedUrl: 'https://storage.example.com/upload?sig=abc',
      expiresAt: Date.now() + 600_000, // 10분 후 만료
    });
    expect(useUploadQueueStore.getState().isPresignedUrlValid(sessionId)).toBe(true);
  });

  // 스펙: "presigned_url_expires_at이 현재 시각 + 60s 이내면 재발급"
  it('만료 60s 이내 URL은 isPresignedUrlValid = false (60초 마진)', () => {
    const sessionId = 'us_test_002';
    useUploadQueueStore.getState().setPresignedUrl(sessionId, {
      uploadSessionId: sessionId,
      presignedUrl: 'https://storage.example.com/upload?sig=xyz',
      expiresAt: Date.now() + 30_000, // 30초 뒤 만료 (60초 마진 미만)
    });
    expect(useUploadQueueStore.getState().isPresignedUrlValid(sessionId)).toBe(false);
  });

  it('만료 정확히 60s 이내 경계값', () => {
    const sessionId = 'us_test_003';
    useUploadQueueStore.getState().setPresignedUrl(sessionId, {
      uploadSessionId: sessionId,
      presignedUrl: 'https://storage.example.com/upload?sig=boundary',
      expiresAt: Date.now() + 60_000, // 정확히 60초 → 마진 미달로 false
    });
    expect(useUploadQueueStore.getState().isPresignedUrlValid(sessionId)).toBe(false);
  });

  it('캐시 없는 sessionId는 isPresignedUrlValid = false', () => {
    expect(useUploadQueueStore.getState().isPresignedUrlValid('nonexistent')).toBe(false);
  });

  it('clearPresignedUrl 후 캐시에서 제거됨', () => {
    const sessionId = 'us_test_004';
    useUploadQueueStore.getState().setPresignedUrl(sessionId, {
      uploadSessionId: sessionId,
      presignedUrl: 'https://storage.example.com/upload?sig=del',
      expiresAt: Date.now() + 600_000,
    });
    expect(useUploadQueueStore.getState().isPresignedUrlValid(sessionId)).toBe(true);

    useUploadQueueStore.getState().clearPresignedUrl(sessionId);
    expect(useUploadQueueStore.getState().isPresignedUrlValid(sessionId)).toBe(false);
  });
});

describe('uploadQueueStore — 슬롯 관리 (동시 업로드 제한)', () => {
  beforeEach(() => {
    useUploadQueueStore.setState({
      presignedUrlCache: {},
      progressMap: {},
      isProcessing: false,
      activeUploadIds: [],
    } as Parameters<typeof useUploadQueueStore.setState>[0]);
  });

  it(`슬롯 0/${MAX_CONCURRENT_UPLOADS} → hasAvailableSlot = true`, () => {
    expect(useUploadQueueStore.getState().hasAvailableSlot()).toBe(true);
  });

  it(`슬롯 ${MAX_CONCURRENT_UPLOADS - 1}/${MAX_CONCURRENT_UPLOADS} → 여전히 슬롯 있음`, () => {
    useUploadQueueStore.getState().addActiveUpload('rec_001');
    expect(useUploadQueueStore.getState().hasAvailableSlot()).toBe(true);
  });

  it(`슬롯 ${MAX_CONCURRENT_UPLOADS}/${MAX_CONCURRENT_UPLOADS} → hasAvailableSlot = false`, () => {
    for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
      useUploadQueueStore.getState().addActiveUpload(`rec_00${i}`);
    }
    expect(useUploadQueueStore.getState().hasAvailableSlot()).toBe(false);
  });

  it('removeActiveUpload 후 슬롯 해제됨', () => {
    for (let i = 0; i < MAX_CONCURRENT_UPLOADS; i++) {
      useUploadQueueStore.getState().addActiveUpload(`rec_00${i}`);
    }
    expect(useUploadQueueStore.getState().hasAvailableSlot()).toBe(false);
    useUploadQueueStore.getState().removeActiveUpload('rec_000');
    expect(useUploadQueueStore.getState().hasAvailableSlot()).toBe(true);
  });
});

describe('uploadQueueStore — 진행률 관리', () => {
  beforeEach(() => {
    useUploadQueueStore.setState({
      presignedUrlCache: {},
      progressMap: {},
      isProcessing: false,
      activeUploadIds: [],
    } as Parameters<typeof useUploadQueueStore.setState>[0]);
  });

  it('setProgress 후 progressMap에 저장', () => {
    useUploadQueueStore.getState().setProgress('rec_server_001', 500_000, 1_000_000);
    const state = useUploadQueueStore.getState();
    expect(state.progressMap['rec_server_001']).toEqual({ bytesUploaded: 500_000, bytesTotal: 1_000_000 });
  });

  it('clearProgress 후 progressMap에서 제거', () => {
    useUploadQueueStore.getState().setProgress('rec_server_002', 200_000, 400_000);
    useUploadQueueStore.getState().clearProgress('rec_server_002');
    expect(useUploadQueueStore.getState().progressMap['rec_server_002']).toBeUndefined();
  });

  it('다른 항목의 progress는 영향 없음', () => {
    useUploadQueueStore.getState().setProgress('rec_a', 100, 1000);
    useUploadQueueStore.getState().setProgress('rec_b', 200, 2000);
    useUploadQueueStore.getState().clearProgress('rec_a');
    expect(useUploadQueueStore.getState().progressMap['rec_b']).toBeDefined();
  });
});

describe('상수값 스펙 검증', () => {
  it(`MAX_UPLOAD_ATTEMPTS = 5 (스펙: 최대 5회)`, () => {
    expect(MAX_UPLOAD_ATTEMPTS).toBe(5);
  });

  it(`MAX_CONCURRENT_UPLOADS = 2 (동시 업로드 슬롯 제한)`, () => {
    expect(MAX_CONCURRENT_UPLOADS).toBe(2);
  });
});
