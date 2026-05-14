import { ServerRecordingCache, TranscriptSegment } from '../types';
import { apiRequest } from './client';

interface RecordingListResponse {
  items: ServerRecordingCache[];
  next_cursor?: string;
}

interface CreateDraftBody {
  title: string;
  note?: string;
  tags?: string[];
  language_hint?: string;
  duration_ms: number;
  file_size_bytes: number;
}

export async function createRecordingDraft(body: CreateDraftBody): Promise<{ id: string }> {
  return apiRequest('POST', '/v1/recordings', body);
}

export async function getRecordingList(params: {
  filter?: string;
  sort?: string;
  cursor?: string;
  limit?: number;
}): Promise<RecordingListResponse> {
  const qs = new URLSearchParams();
  if (params.filter && params.filter !== 'all') qs.set('status', params.filter);
  if (params.sort) qs.set('sort', params.sort);
  if (params.cursor) qs.set('cursor', params.cursor);
  qs.set('limit', String(params.limit ?? 20));
  return apiRequest('GET', `/v1/recordings?${qs}`);
}

export async function updateRecordingMeta(
  id: string,
  patch: Partial<Pick<ServerRecordingCache, 'title' | 'note' | 'tags' | 'languageHint'>>,
): Promise<void> {
  await apiRequest('PATCH', `/v1/recordings/${id}`, patch);
}

export async function softDeleteRecording(id: string): Promise<void> {
  await apiRequest('DELETE', `/v1/recordings/${id}`);
}

export async function requestTranscription(recordingId: string): Promise<{ transcriptionId: string }> {
  // provider 필드 포함하지 않음 — 서버가 라우팅 (가드레일)
  return apiRequest('POST', `/v1/recordings/${recordingId}/transcriptions`, {});
}

export async function retryTranscription(transcriptionId: string): Promise<void> {
  await apiRequest('POST', `/v1/transcriptions/${transcriptionId}/retry`, {});
}

export async function searchRecordings(params: {
  q: string;
  field: string;
  limit?: number;
}): Promise<{ items: ServerRecordingCache[] }> {
  const qs = new URLSearchParams();
  qs.set('q', params.q);
  qs.set('field', params.field);
  qs.set('limit', String(params.limit ?? 20));
  return apiRequest('GET', `/v1/recordings/search?${qs}`);
}

// 전사 결과 조회
export async function getTranscript(
  recordingId: string
): Promise<(TranscriptSegment & { id?: string })[]> {
  const res = await apiRequest<{ segments: (TranscriptSegment & { id?: string })[] }>(
    'GET',
    `/v1/recordings/${recordingId}/transcript`
  );
  return res.segments ?? [];
}

// 전사 편집본 저장
export async function saveTranscriptEdits(
  recordingId: string,
  segments: (TranscriptSegment & { id: string })[]
): Promise<void> {
  await apiRequest('PATCH', `/v1/recordings/${recordingId}/transcript`, { segments });
}
