import { filterStarred, filterArchived, collectAllTags } from '../src/features/library/libraryUtils';
import { ServerRecordingCache } from '../src/types';

function makeItem(overrides: Partial<ServerRecordingCache>): ServerRecordingCache {
  return {
    id: 'id-1',
    title: '제목',
    tags: [],
    uploadState: 'uploaded',
    transcriptionState: 'completed',
    recordingState: 'saved_local',
    createdAt: 1000,
    updatedAt: 1000,
    cachedAt: 1000,
    ...overrides,
  };
}

describe('filterStarred', () => {
  it('isStarred가 true인 항목만 반환한다', () => {
    const items = [
      makeItem({ id: 'a', isStarred: true }),
      makeItem({ id: 'b', isStarred: false }),
      makeItem({ id: 'c' }),
    ];
    const result = filterStarred(items);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('즐겨찾기 항목이 없으면 빈 배열을 반환한다', () => {
    const items = [makeItem({ id: 'a' }), makeItem({ id: 'b' })];
    expect(filterStarred(items)).toEqual([]);
  });

  it('빈 배열 입력 시 빈 배열을 반환한다', () => {
    expect(filterStarred([])).toEqual([]);
  });
});

describe('filterArchived', () => {
  it('recordingState가 archived인 항목만 반환한다', () => {
    const items = [
      makeItem({ id: 'a', recordingState: 'archived' }),
      makeItem({ id: 'b', recordingState: 'saved_local' }),
      makeItem({ id: 'c', recordingState: 'archived' }),
    ];
    const result = filterArchived(items);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('보관된 항목이 없으면 빈 배열을 반환한다', () => {
    const items = [makeItem({ recordingState: 'saved_local' })];
    expect(filterArchived(items)).toEqual([]);
  });

  it('빈 배열 입력 시 빈 배열을 반환한다', () => {
    expect(filterArchived([])).toEqual([]);
  });
});

describe('collectAllTags', () => {
  it('모든 항목에서 고유 태그를 알파벳 순으로 반환한다', () => {
    const items = [
      makeItem({ tags: ['회의', '기획'] }),
      makeItem({ tags: ['회의', '개발'] }),
      makeItem({ tags: [] }),
    ];
    expect(collectAllTags(items)).toEqual(['개발', '기획', '회의']);
  });

  it('태그가 하나도 없으면 빈 배열을 반환한다', () => {
    const items = [makeItem({ tags: [] }), makeItem({ tags: [] })];
    expect(collectAllTags(items)).toEqual([]);
  });

  it('빈 배열 입력 시 빈 배열을 반환한다', () => {
    expect(collectAllTags([])).toEqual([]);
  });

  it('중복 태그는 한 번만 포함된다', () => {
    const items = [
      makeItem({ tags: ['A', 'B'] }),
      makeItem({ tags: ['B', 'C'] }),
    ];
    const result = collectAllTags(items);
    expect(result).toHaveLength(3);
    expect(result).toContain('B');
  });
});
