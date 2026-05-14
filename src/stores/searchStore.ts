import { create } from 'zustand';
import { ServerRecordingCache } from '../types';

const MAX_RECENT = 10;

interface SearchState {
  query: string;
  recentQueries: string[];
  results: ServerRecordingCache[];
  isSearching: boolean;
  searchError: string | null;

  setQuery: (q: string) => void;
  commitQuery: () => void;
  removeRecentQuery: (q: string) => void;
  setResults: (results: ServerRecordingCache[]) => void;
  setSearching: (v: boolean) => void;
  setSearchError: (err: string | null) => void;
  clearResults: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  recentQueries: [],
  results: [],
  isSearching: false,
  searchError: null,

  setQuery: (q) => set({ query: q }),

  commitQuery: () => {
    const { query, recentQueries } = get();
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentQueries.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
    set({ recentQueries: updated });
  },

  removeRecentQuery: (q) =>
    set((s) => ({ recentQueries: s.recentQueries.filter((r) => r !== q) })),

  setResults: (results) => set({ results }),
  setSearching: (v) => set({ isSearching: v }),
  setSearchError: (err) => set({ searchError: err }),
  clearResults: () => set({ results: [], searchError: null }),
}));
