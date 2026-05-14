import { act } from 'react';
import { useTranscriptStore } from '../src/stores/transcriptStore';

describe('transcriptStore', () => {
  beforeEach(() => {
    useTranscriptStore.getState().reset();
  });

  it('초기 상태는 빈 segments, editMode false', () => {
    const s = useTranscriptStore.getState();
    expect(s.recordingId).toBeNull();
    expect(s.segments).toEqual([]);
    expect(s.editMode).toBe(false);
    expect(s.pendingEdits).toEqual({});
  });

  it('toggleEditMode가 editMode를 반전시킨다', () => {
    act(() => useTranscriptStore.getState().toggleEditMode());
    expect(useTranscriptStore.getState().editMode).toBe(true);
    act(() => useTranscriptStore.getState().toggleEditMode());
    expect(useTranscriptStore.getState().editMode).toBe(false);
  });

  it('editSegment가 pendingEdits에 변경 내용을 저장한다', () => {
    act(() => useTranscriptStore.getState().editSegment('seg-1', '수정된 텍스트'));
    expect(useTranscriptStore.getState().pendingEdits['seg-1']).toBe('수정된 텍스트');
  });

  it('reset이 상태를 초기화한다', () => {
    act(() => {
      useTranscriptStore.getState().editSegment('seg-1', '텍스트');
      useTranscriptStore.getState().toggleEditMode();
    });
    act(() => useTranscriptStore.getState().reset());
    const s = useTranscriptStore.getState();
    expect(s.pendingEdits).toEqual({});
    expect(s.editMode).toBe(false);
  });
});
