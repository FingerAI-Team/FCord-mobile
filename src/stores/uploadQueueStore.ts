import { create } from 'zustand';
import { PresignedUrlCache } from '../types';

export const MAX_UPLOAD_ATTEMPTS = 5;
export const MAX_CONCURRENT_UPLOADS = 2; // D4: 동시 업로드 슬롯 제한
// W1: calcNextRetryAt은 uploadQueue.ts에서 단일 정의 — 이 파일에서 중복 정의 제거

interface UploadQueueState {
  // S1: presigned URL은 메모리 전용 (DB에 저장 안 함)
  presignedUrlCache: Record<string, PresignedUrlCache>; // key: uploadSessionId

  // 실시간 진행률 (메모리 전용)
  progressMap: Record<string, { bytesUploaded: number; bytesTotal: number }>;

  // D3: 중복 실행 방지 플래그
  isProcessing: boolean;

  // D4: 현재 업로드 중인 recordingId 목록
  activeUploadIds: string[];

  setPresignedUrl: (sessionId: string, cache: PresignedUrlCache) => void;
  clearPresignedUrl: (sessionId: string) => void;
  getPresignedUrl: (sessionId: string) => PresignedUrlCache | undefined;
  isPresignedUrlValid: (sessionId: string) => boolean;

  setProgress: (recordingId: string, bytesUploaded: number, bytesTotal: number) => void;
  clearProgress: (recordingId: string) => void;

  setIsProcessing: (v: boolean) => void;
  addActiveUpload: (recordingId: string) => void;
  removeActiveUpload: (recordingId: string) => void;
  hasAvailableSlot: () => boolean;
}

export const useUploadQueueStore = create<UploadQueueState>((set, get) => ({
  presignedUrlCache: {},
  progressMap: {},
  isProcessing: false,
  activeUploadIds: [],

  setPresignedUrl: (sessionId, cache) =>
    set((s) => ({ presignedUrlCache: { ...s.presignedUrlCache, [sessionId]: cache } })),

  clearPresignedUrl: (sessionId) =>
    set((s) => {
      const { [sessionId]: _, ...rest } = s.presignedUrlCache;
      return { presignedUrlCache: rest };
    }),

  getPresignedUrl: (sessionId) => get().presignedUrlCache[sessionId],

  // 만료 60초 이내는 만료된 것으로 처리 → 재발급 트리거
  isPresignedUrlValid: (sessionId) => {
    const cache = get().presignedUrlCache[sessionId];
    if (!cache) return false;
    return cache.expiresAt > Date.now() + 60_000;
  },

  setProgress: (recordingId, bytesUploaded, bytesTotal) =>
    set((s) => ({
      progressMap: { ...s.progressMap, [recordingId]: { bytesUploaded, bytesTotal } },
    })),

  clearProgress: (recordingId) =>
    set((s) => {
      const { [recordingId]: _, ...rest } = s.progressMap;
      return { progressMap: rest };
    }),

  setIsProcessing: (v) => set({ isProcessing: v }),

  addActiveUpload: (recordingId) =>
    set((s) => ({ activeUploadIds: [...s.activeUploadIds, recordingId] })),

  removeActiveUpload: (recordingId) =>
    set((s) => ({ activeUploadIds: s.activeUploadIds.filter((id) => id !== recordingId) })),

  hasAvailableSlot: () => get().activeUploadIds.length < MAX_CONCURRENT_UPLOADS,
}));
