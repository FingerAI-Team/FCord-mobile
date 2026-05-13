// 3-track 상태: 절대 단일 status로 합치지 말 것 (가드레일)
export type RecordingState = 'draft' | 'recording' | 'paused' | 'saved_local' | 'archived' | 'deleted';
export type UploadState = 'not_started' | 'queued' | 'uploading' | 'uploaded' | 'failed' | 'retrying';
export type TranscriptionState = 'not_requested' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type UploadQueueStatus = 'pending' | 'uploading' | 'completing' | 'done' | 'failed' | 'cancelled';
export type FilterType = 'all' | 'uploading' | 'done' | 'failed';
export type SortType = 'recent' | 'duration';

export interface LocalRecording {
  id: string;
  title: string;
  draftState: RecordingState;
  filePath: string;
  durationMs: number;
  fileSizeBytes: number;
  checksumSha256: string;
  serverRecordingId?: string;
  createdAt: number;
}

// presigned_url은 DB에 저장하지 않는다 (S1 보안 fix)
export interface LocalUploadQueue {
  id: string;
  recordingId: string;
  uploadSessionId?: string; // session ID만 DB에 보관
  bytesTotal: number;
  bytesUploaded: number;
  attempts: number;
  lastError?: string;
  nextRetryAt?: number;
  status: UploadQueueStatus;
  createdAt: number;
  updatedAt: number;
}

// presigned URL은 메모리 전용 (S1 fix)
export interface PresignedUrlCache {
  uploadSessionId: string;
  presignedUrl: string;
  expiresAt: number; // ms
}

export interface ServerRecordingCache {
  id: string;
  title: string;
  note?: string;
  tags: string[];
  languageHint?: string;
  durationMs?: number;
  fileSizeBytes?: number;
  uploadState: UploadState;
  transcriptionState: TranscriptionState;
  recordingState: RecordingState;
  createdAt: number;
  updatedAt: number;
  transcriptPreview?: string;
  cachedAt: number;
}

export interface TranscriptSegment {
  startMs: number;
  endMs: number;
  speakerLabel: string;
  text: string;
  confidenceAvg: number;
}
