export type SearchTab = 'title' | 'body' | 'memo';
export type SearchView = 'initial' | 'loading' | 'results' | 'empty';

// UI 탭 → API field 파라미터 매핑
export function fieldParam(tab: SearchTab): string {
  if (tab === 'body') return 'transcript';
  if (tab === 'memo') return 'note';
  return 'title';
}

// 현재 상태로부터 렌더링 분기 결정
export function resolveSearchView(
  query: string,
  isSearching: boolean,
  resultsCount: number,
): SearchView {
  if (!query) return 'initial';
  if (isSearching) return 'loading';
  if (resultsCount > 0) return 'results';
  return 'empty';
}
