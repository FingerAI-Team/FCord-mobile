// FAICORD API 연동 레이어
// FAICORD 응답 → 앱 내부 타입(ServerRecordingCache / TranscriptSegment) 변환
import { ServerRecordingCache, TranscriptSegment, TranscriptionState } from '../types';
import { apiRequest, apiUpload } from './client';

// ─── FAICORD 응답 타입 ───────────────────────────────────────────────────────

interface FaicordMeetingItem {
  confId: string;
  subject: string;
  createDt: string;       // "2026-05-27T14:22:00"
  participant: string;
  statusCode?: string | null;
}

interface FaicordMeetingDetail {
  meetingId: string;
  title: string;
  date: string;
  time: string;
  endTime: string | null;
  location: string | null;
  memo: string | null;
  participants: string[];
  summary: string | null;
  statusCode: string | null;
  activeSummaryType: string | null;
}

interface FaicordTranscriptSegment {
  speaker: string;
  text: string;
  start: string;    // "00:00:00.00"
  end: string;
  sequence_index: number;
}

// ─── statusCode 매핑 ────────────────────────────────────────────────────────
// "000" = 변환 완료 확인됨 (transcript 데이터 있음)
// null / "" = 업로드 완료, 변환 미요청 또는 대기
// 기타 = 처리 중 또는 실패 (추후 정밀화)

function mapStatusCode(code: string | null): TranscriptionState {
  if (code === '000') return 'completed';
  if (!code || code === '') return 'not_requested';
  if (code.startsWith('9') || code.startsWith('-')) return 'failed';
  return 'processing';
}

// ─── HH:MM:SS.ss → ms 변환 ──────────────────────────────────────────────────
function timeToMs(t: string): number {
  const [hms, frac = '0'] = t.split('.');
  const [h, m, s] = hms.split(':').map(Number);
  return (h * 3600 + m * 60 + s) * 1000 + Math.round(Number(`0.${frac}`) * 1000);
}

// ─── FAICORD 응답 → ServerRecordingCache ────────────────────────────────────
function toCache(item: FaicordMeetingItem): ServerRecordingCache {
  const ts = new Date(item.createDt).getTime();
  return {
    id: item.confId,
    title: item.subject,
    tags: [],
    note: undefined,
    uploadState: 'uploaded',
    transcriptionState: mapStatusCode(item.statusCode ?? null),
    recordingState: 'saved_local',
    createdAt: ts,
    updatedAt: ts,
    cachedAt: Date.now(),
  };
}

// ─── 회의 목록 ───────────────────────────────────────────────────────────────
interface RecordingListResponse {
  items: ServerRecordingCache[];
  next_cursor?: string;
}

export async function getRecordingList(_params: {
  filter?: string;
  sort?: string;
  cursor?: string;
  limit?: number;
}): Promise<RecordingListResponse> {
  const raw = await apiRequest<FaicordMeetingItem[]>('GET', '/api/meetings');
  const items = (raw ?? []).map(toCache);
  return { items, next_cursor: undefined };
}

// ─── 회의 상세 (statusCode 포함) ─────────────────────────────────────────────
export async function getMeetingDetail(id: string): Promise<ServerRecordingCache | null> {
  const res = await apiRequest<{ success: boolean; meeting: FaicordMeetingDetail }>(
    'GET',
    `/api/meetings/${id}`,
  );
  if (!res?.success || !res.meeting) return null;
  const m = res.meeting;
  const ts = new Date(`${m.date}T${m.time}`).getTime();
  return {
    id: m.meetingId,
    title: m.title,
    note: m.memo ?? undefined,
    tags: [],
    uploadState: 'uploaded',
    transcriptionState: mapStatusCode(m.statusCode),
    recordingState: 'saved_local',
    createdAt: ts,
    updatedAt: ts,
    cachedAt: Date.now(),
    transcriptPreview: m.summary ?? undefined,
  };
}

// ─── 전사 결과 조회 ──────────────────────────────────────────────────────────
export async function getTranscript(
  recordingId: string,
): Promise<(TranscriptSegment & { id?: string })[]> {
  const raw = await apiRequest<FaicordTranscriptSegment[]>(
    'GET',
    `/api/meetings/transcript/${recordingId}`,
  );
  return (raw ?? []).map((seg) => ({
    id: `seg-${seg.sequence_index}`,
    speakerLabel: seg.speaker,
    text: seg.text,
    startMs: timeToMs(seg.start),
    endMs: timeToMs(seg.end),
    confidenceAvg: 0, // FAICORD는 신뢰도 점수 미제공
  }));
}

// ─── 음성 파일 업로드 ────────────────────────────────────────────────────────
export async function uploadRecording(
  fileUri: string,
  fileName: string,
  mimeType: string = 'audio/mp4',
  title?: string,
): Promise<{ confId: string }> {
  const formData = new FormData();
  // 서버 @RequestPart(value = "audioFile") 와 필드명 일치
  formData.append('audioFile', { uri: fileUri, name: fileName, type: mimeType } as any);

  // startDateTime 없으면 서버가 null로 저장 → date:"" → MinutesPage 날짜 필터 탈락
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  formData.append('startDateTime', startDateTime);

  if (title && title.trim()) {
    formData.append('title', title.trim());
  }

  const res = await apiUpload<{ success: boolean; meetingId: string }>(
    '/api/meetings/upload',
    formData,
  );
  if (!res.success || !res.meetingId) throw new Error('업로드 응답 오류');
  return { confId: res.meetingId };
}

// ─── 회의 저장 (draft 생성 → 업로드) ────────────────────────────────────────
// RecordingScreen에서 호출. fileUri가 없으면 빈 draft만 생성.
export async function createRecordingDraft(body: {
  title: string;
  duration_ms: number;
  file_size_bytes: number;
  fileUri?: string;
  fileName?: string;
}): Promise<{ id: string }> {
  if (body.fileUri && body.fileName) {
    const res = await uploadRecording(body.fileUri, body.fileName);
    return { id: res.confId };
  }
  // 파일 없이 title만 생성하는 draft — FAICORD에 해당 엔드포인트 없으므로 임시 ID 반환
  return { id: `draft-${Date.now()}` };
}

// ─── 메타 수정, 삭제, 재처리 (FAICORD 엔드포인트 확인 전 stub) ──────────────

export async function updateRecordingMeta(
  _id: string,
  _patch: Partial<Pick<ServerRecordingCache, 'title' | 'note' | 'tags'>>,
): Promise<void> {
  // TODO: FAICORD 엔드포인트 확인 후 구현
}

export async function softDeleteRecording(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/meetings/${id}`);
}

export async function requestTranscription(_recordingId: string): Promise<{ transcriptionId: string }> {
  return { transcriptionId: _recordingId };
}

export async function retryTranscription(transcriptionId: string): Promise<void> {
  await apiRequest('POST', `/api/meetings/transcript/${transcriptionId}/regenerate`, {});
}

export async function searchRecordings(params: {
  q: string;
  limit?: number;
}): Promise<{ items: ServerRecordingCache[] }> {
  const qs = new URLSearchParams({ keyword: params.q });
  const raw = await apiRequest<FaicordMeetingItem[]>(
    'GET',
    `/api/meetings/minutes?${qs}`,
  );
  return { items: (raw ?? []).map(toCache) };
}

// 전사 편집 저장 (FAICORD 엔드포인트 확인 전 no-op)
export async function saveTranscriptEdits(
  _recordingId: string,
  _segments: (TranscriptSegment & { id: string })[],
): Promise<void> {
  // TODO: FAICORD 편집 저장 엔드포인트 확인 후 구현
}
