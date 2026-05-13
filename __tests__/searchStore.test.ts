import { useSearchStore } from '../src/stores/searchStore';

describe('searchStore', () => {
  beforeEach(() => {
    useSearchStore.setState({ query: '', recentQueries: [], results: [] });
  });

  it('초기 상태: 쿼리 빈 문자열, 최근 검색어 빈 배열', () => {
    const { query, recentQueries } = useSearchStore.getState();
    expect(query).toBe('');
    expect(recentQueries).toHaveLength(0);
  });

  it('setQuery로 쿼리가 업데이트된다', () => {
    useSearchStore.getState().setQuery('회의');
    expect(useSearchStore.getState().query).toBe('회의');
  });

  it('commitQuery로 최근 검색어에 추가된다', () => {
    useSearchStore.getState().setQuery('회의록');
    useSearchStore.getState().commitQuery();
    expect(useSearchStore.getState().recentQueries[0]).toBe('회의록');
  });

  it('중복 쿼리는 최근 검색어에 중복 저장되지 않는다', () => {
    useSearchStore.getState().setQuery('테스트');
    useSearchStore.getState().commitQuery();
    useSearchStore.getState().setQuery('테스트');
    useSearchStore.getState().commitQuery();
    const { recentQueries } = useSearchStore.getState();
    expect(recentQueries.filter((q) => q === '테스트')).toHaveLength(1);
  });

  it('빈 쿼리는 최근 검색어에 추가되지 않는다', () => {
    useSearchStore.getState().setQuery('');
    useSearchStore.getState().commitQuery();
    expect(useSearchStore.getState().recentQueries).toHaveLength(0);
  });

  it('removeRecentQuery로 특정 검색어를 삭제한다', () => {
    useSearchStore.setState({ recentQueries: ['회의', '인터뷰', '현장'] });
    useSearchStore.getState().removeRecentQuery('인터뷰');
    expect(useSearchStore.getState().recentQueries).toEqual(['회의', '현장']);
  });

  it('최근 검색어는 최대 10개를 초과하지 않는다', () => {
    const store = useSearchStore.getState();
    for (let i = 0; i < 12; i++) {
      store.setQuery(`쿼리${i}`);
      store.commitQuery();
    }
    expect(useSearchStore.getState().recentQueries.length).toBeLessThanOrEqual(10);
  });
});
