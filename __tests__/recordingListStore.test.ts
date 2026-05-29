import { useRecordingListStore } from '../src/stores/recordingListStore';
import { ServerRecordingCache } from '../src/types';

function makeItem(id: string): ServerRecordingCache {
  const now = Date.now();
  return {
    id,
    title: `recording-${id}`,
    tags: [],
    uploadState: 'uploaded',
    transcriptionState: 'completed',
    recordingState: 'saved_local',
    createdAt: now,
    updatedAt: now,
    cachedAt: now,
  };
}

describe('recordingListStore', () => {
  beforeEach(() => {
    useRecordingListStore.getState().reset();
  });

  it('appendItems는 기존 id와 중복되는 항목을 다시 추가하지 않는다', () => {
    const first = makeItem('rec_001');
    const second = makeItem('rec_002');

    useRecordingListStore.getState().setItems([first], 'cursor-1');
    useRecordingListStore.getState().appendItems([first, second], 'cursor-2');

    expect(useRecordingListStore.getState().items.map((item) => item.id)).toEqual([
      'rec_001',
      'rec_002',
    ]);
  });
});
