import { ServerRecordingCache } from '../../types';

export interface DetailActions {
  showRetryUpload: boolean;
  showRetryTranscription: boolean;
  showRequestTranscription: boolean; // C2: 업로드 완료 + STT 미요청
  showViewTranscript: boolean;
}

// 3-track 상태 조합 → 상세 화면에서 표시할 액션 결정
export function resolveDetailActions(r: ServerRecordingCache): DetailActions {
  return {
    showRetryUpload: r.uploadState === 'failed',
    showRetryTranscription: r.transcriptionState === 'failed',
    showRequestTranscription:
      r.uploadState === 'uploaded' && r.transcriptionState === 'not_requested',
    showViewTranscript: r.transcriptionState === 'completed',
  };
}

// 제목 저장 여부 — 비어있거나 변경 없으면 API 호출 스킵
export function shouldSaveTitle(editedTitle: string, currentTitle: string): boolean {
  const trimmed = editedTitle.trim();
  return trimmed.length > 0 && trimmed !== currentTitle;
}
