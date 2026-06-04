import { create } from 'zustand';
import { ServerRecordingCache, FilterType, SortType } from '../types';

interface RecordingListState {
  items: ServerRecordingCache[];
  filter: FilterType;
  sort: SortType;
  searchQuery: string;
  nextCursor?: string;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;

  setItems: (items: ServerRecordingCache[], nextCursor?: string) => void;
  appendItems: (items: ServerRecordingCache[], nextCursor?: string) => void;
  updateItem: (id: string, patch: Partial<ServerRecordingCache>) => void;
  removeItem: (id: string) => void;
  restoreItem: (item: ServerRecordingCache) => void;
  toggleStar: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setSearchQuery: (q: string) => void;
  setLoading: (v: boolean) => void;
  setRefreshing: (v: boolean) => void;
  reset: () => void;
}

export const useRecordingListStore = create<RecordingListState>((set) => ({
  items: [],
  filter: 'all',
  sort: 'recent',
  searchQuery: '',
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

  restoreItem: (item) => set((s) => ({ items: [item, ...s.items] })),

  toggleStar: (id) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      ),
    })),

  setFilter: (filter) => set({ filter, nextCursor: undefined, hasMore: true }),
  setSort: (sort) => set({ sort, nextCursor: undefined, hasMore: true }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (v) => set({ isLoading: v }),
  setRefreshing: (v) => set({ isRefreshing: v }),
  reset: () => set({ items: [], nextCursor: undefined, hasMore: true }),
}));

// 필터+검색어 → API에 보낼 filter 파라미터 변환 (starred/processing은 클라이언트 필터링)
export function toApiFilter(f: FilterType): string {
  if (f === 'done') return 'done';
  return 'all';
}
