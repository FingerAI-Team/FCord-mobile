import { create } from 'zustand';

// 최근 검색어 최대 보관 개수
const MAX_RECENT = 10;

interface SearchState {
  query: string;
  recentQueries: string[];
  results: string[]; // 추후 ServerRecordingCache[]로 교체

  setQuery: (q: string) => void;
  // 현재 query를 recentQueries 앞에 추가 (중복 제거, 최대 MAX_RECENT개)
  commitQuery: () => void;
  removeRecentQuery: (q: string) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  recentQueries: [],
  results: [],

  setQuery: (q) => set({ query: q }),

  commitQuery: () => {
    const { query, recentQueries } = get();
    const trimmed = query.trim();
    // 빈 문자열은 최근 검색어에 추가하지 않는다
    if (!trimmed) return;
    const updated = [trimmed, ...recentQueries.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
    set({ recentQueries: updated });
  },

  removeRecentQuery: (q) =>
    set((s) => ({ recentQueries: s.recentQueries.filter((r) => r !== q) })),

  clearResults: () => set({ results: [] }),
}));
