import { create } from 'zustand';
import { ServerRecordingCache, FilterType, SortType } from '../types';

interface RecordingListState {
  items: ServerRecordingCache[];
  filter: FilterType;
  sort: SortType;
  nextCursor?: string;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;

  setItems: (items: ServerRecordingCache[], nextCursor?: string) => void;
  appendItems: (items: ServerRecordingCache[], nextCursor?: string) => void;
  updateItem: (id: string, patch: Partial<ServerRecordingCache>) => void;
  removeItem: (id: string) => void;
  restoreItem: (item: ServerRecordingCache) => void; // U1: 삭제 실패 시 롤백
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setLoading: (v: boolean) => void;
  setRefreshing: (v: boolean) => void;
  reset: () => void;
}

export const useRecordingListStore = create<RecordingListState>((set) => ({
  items: [],
  filter: 'all',
  sort: 'recent',
  nextCursor: undefined,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,

  setItems: (items, nextCursor) => set({ items, nextCursor, hasMore: !!nextCursor }),

  appendItems: (newItems, nextCursor) =>
    set((s) => ({
      items: [
        ...s.items,
        ...newItems.filter((newItem) => !s.items.some((existingItem) => existingItem.id === newItem.id)),
      ],
      nextCursor,
      hasMore: !!nextCursor,
    })),

  updateItem: (id, patch) =>
    set((s) => ({
      items: s.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  removeItem: (id) => set((s) => ({ items: s.items.filter((item) => item.id !== id) })),

  // U1: 서버 삭제 실패 시 로컬 목록 복원
  restoreItem: (item) => set((s) => ({ items: [item, ...s.items] })),

  setFilter: (filter) => set({ filter, nextCursor: undefined, hasMore: true }),
  setSort: (sort) => set({ sort, nextCursor: undefined, hasMore: true }),
  setLoading: (v) => set({ isLoading: v }),
  setRefreshing: (v) => set({ isRefreshing: v }),
  reset: () => set({ items: [], nextCursor: undefined, hasMore: true }),
}));
