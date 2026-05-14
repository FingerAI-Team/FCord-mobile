import { create } from 'zustand';
import { TranscriptSegment } from '../types';
import { getTranscript, saveTranscriptEdits } from '../api/recordings';

interface TranscriptState {
  recordingId: string | null;
  segments: (TranscriptSegment & { id: string })[];
  editMode: boolean;
  pendingEdits: Record<string, string>;
  isLoading: boolean;
  error: string | null;

  loadTranscript: (recordingId: string) => Promise<void>;
  toggleEditMode: () => void;
  editSegment: (segmentId: string, text: string) => void;
  saveEdits: () => Promise<void>;
  reset: () => void;
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  recordingId: null,
  segments: [],
  editMode: false,
  pendingEdits: {},
  isLoading: false,
  error: null,

  // 전사 결과 로드 — 서버에서 segments를 받아 id 부여
  loadTranscript: async (recordingId) => {
    set({ isLoading: true, error: null, recordingId });
    try {
      const raw = await getTranscript(recordingId);
      const segments = raw.map((seg, i) => ({ ...seg, id: `seg-${i}` }));
      set({ segments, isLoading: false });
    } catch {
      set({ error: '전사 결과를 불러오지 못했습니다', isLoading: false });
    }
  },

  // editMode 토글
  toggleEditMode: () =>
    set((s) => ({ editMode: !s.editMode })),

  // 개별 segment 편집 내용을 pendingEdits에 임시 저장
  editSegment: (segmentId, text) =>
    set((s) => ({
      pendingEdits: { ...s.pendingEdits, [segmentId]: text },
    })),

  // pendingEdits를 서버에 저장하고 로컬 상태 반영
  saveEdits: async () => {
    const { recordingId, segments, pendingEdits } = get();
    if (!recordingId || Object.keys(pendingEdits).length === 0) return;
    const updated = segments.map((seg) =>
      pendingEdits[seg.id] !== undefined
        ? { ...seg, text: pendingEdits[seg.id] }
        : seg
    );
    set({ isLoading: true });
    try {
      await saveTranscriptEdits(recordingId, updated);
      set({ segments: updated, pendingEdits: {}, editMode: false, isLoading: false });
    } catch {
      set({ error: '저장에 실패했습니다', isLoading: false });
    }
  },

  // 상태 전체 초기화
  reset: () =>
    set({
      recordingId: null,
      segments: [],
      editMode: false,
      pendingEdits: {},
      isLoading: false,
      error: null,
    }),
}));
