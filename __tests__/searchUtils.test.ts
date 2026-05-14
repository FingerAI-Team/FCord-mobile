import { fieldParam, resolveSearchView } from '../src/features/search/searchUtils';

describe('fieldParam', () => {
  it('title 탭은 "title"을 반환한다', () => {
    expect(fieldParam('title')).toBe('title');
  });

  it('body 탭은 "transcript"를 반환한다', () => {
    expect(fieldParam('body')).toBe('transcript');
  });

  it('memo 탭은 "note"를 반환한다', () => {
    expect(fieldParam('memo')).toBe('note');
  });
});

describe('resolveSearchView', () => {
  it('query가 빈 문자열이면 "initial"을 반환한다', () => {
    expect(resolveSearchView('', false, 0)).toBe('initial');
    expect(resolveSearchView('', true, 5)).toBe('initial');
  });

  it('query가 있고 isSearching이면 "loading"을 반환한다', () => {
    expect(resolveSearchView('회의', true, 0)).toBe('loading');
  });

  it('query가 있고 결과가 있으면 "results"를 반환한다', () => {
    expect(resolveSearchView('회의', false, 3)).toBe('results');
  });

  it('query가 있고 검색 완료되었지만 결과가 없으면 "empty"를 반환한다', () => {
    expect(resolveSearchView('없는검색어', false, 0)).toBe('empty');
  });
});
