import { Platform, PermissionsAndroid } from 'react-native';
import Upload from 'react-native-background-upload';
import NetInfo from '@react-native-community/netinfo';
import * as Keychain from 'react-native-keychain';
import { Q } from '@nozbe/watermelondb';
import { database } from '../../db/database';
import { LocalRecordingModel } from '../../db/models/LocalRecordingModel';
import { LocalUploadQueueModel } from '../../db/models/LocalUploadQueueModel';
import { useUploadQueueStore, MAX_UPLOAD_ATTEMPTS, MAX_CONCURRENT_UPLOADS } from '../../stores/uploadQueueStore';
import { requestPresignedUrl, completeUploadSession } from '../../api/uploadSessions';
import { requestTranscription } from '../../api/recordings';
import { ApiError } from '../../api/client';
import { isQueueItemReady, calcNextRetryAt } from './uploadQueue';

let netInfoUnsubscribe: (() => void) | null = null;

// D1: 앱 시작 시 호출 — 큐 복구 + 네트워크 복귀 리스너 등록
export function initQueue(): void {
  if (!netInfoUnsubscribe) {
    netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) processQueue();
    });
  }
  // completing 항목 복구 (D2) + pending/retrying 재개
  processQueue();
}

export function destroyQueue(): void {
  netInfoUnsubscribe?.();
  netInfoUnsubscribe = null;
}

// S2: 국외이전 동의 확인 — Keychain에서 읽음
async function hasCrossBorderConsent(): Promise<boolean> {
  try {
    const result = await Keychain.getGenericPassword({ service: 'ibk_stt_consent' });
    if (!result) return false;
    const consent = JSON.parse(result.password);
    return consent.cross_border === true;
  } catch (err) {
    // W2: Keychain 접근 실패 시 STT가 차단되므로 반드시 로깅
    console.error('[STT] 국외이전 동의 Keychain 읽기 실패 — STT 차단됨:', err);
    return false;
  }
}

export async function saveCrossBorderConsent(agreed: boolean): Promise<void> {
  await Keychain.setGenericPassword(
    'consent',
    JSON.stringify({ cross_border: agreed, agreed_at: Date.now() }),
    { service: 'ibk_stt_consent' },
  );
}

// U2: 알림 권한 상태 확인 (업로드 시작 전 안내용)
export async function checkNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result;
  }
  // iOS: react-native-permissions으로 처리 (호출부에서)
  return true;
}

// D3: isProcessing 플래그로 중복 실행 방지
export async function processQueue(): Promise<void> {
  const store = useUploadQueueStore.getState();
  if (store.isProcessing) return;
  store.setIsProcessing(true);
  try {
    await _drainQueue();
  } finally {
    store.setIsProcessing(false);
  }
}

async function _drainQueue(): Promise<void> {
  const queueCol = database.get<LocalUploadQueueModel>('local_upload_queue');

  // D2: completing 상태 먼저 처리 (앱 재시작 복구)
  const completingItems = await queueCol
    .query(Q.where('status', 'completing'))
    .fetch();
  for (const item of completingItems) {
    await _handleCompleting(item);
  }

  // D4 + C2: 슬롯 있는 동안 ready 항목 처리
  const store = useUploadQueueStore.getState();
  while (store.hasAvailableSlot()) {
    const item = await _pickNextReadyItem();
    if (!item) break;

    store.addActiveUpload(item.recordingId);
    _processItem(item).finally(() => {
      useUploadQueueStore.getState().removeActiveUpload(item.recordingId);
      // 슬롯 비면 다음 항목 자동 처리
      processQueue();
    });
  }
}

// C2: HOL blocking 없는 ready 항목 선택
async function _pickNextReadyItem(): Promise<LocalUploadQueueModel | null> {
  const queueCol = database.get<LocalUploadQueueModel>('local_upload_queue');
  const candidates = await queueCol
    .query(Q.or(Q.where('status', 'pending'), Q.where('status', 'retrying')))
    .fetch();

  const activeIds = useUploadQueueStore.getState().activeUploadIds;
  return (
    candidates.find(
      (item) =>
        !activeIds.includes(item.recordingId) &&
        isQueueItemReady(item.status, item.nextRetryAt),
    ) ?? null
  );
}

// D2: completing → done 멱등 처리
async function _handleCompleting(item: LocalUploadQueueModel): Promise<void> {
  const recCol = database.get<LocalRecordingModel>('local_recordings');
  const recording = await recCol.find(item.recordingId).catch(() => null);
  if (!recording?.serverRecordingId || !item.uploadSessionId) return;

  const store = useUploadQueueStore.getState();

  try {
    // SR-W1: bytesUploaded(실제 전송량)를 전달 — bytesTotal과 다를 수 있음
    await completeUploadSession(item.uploadSessionId, recording.checksumSha256, item.bytesUploaded);
    await database.write(async () => {
      await item.update((r) => { r.status = 'done'; r.updatedAt = Date.now(); });
    });
    // SR-W2: done 전환 후 presigned URL 캐시 정리 (S1 설계 완성)
    store.clearPresignedUrl(item.uploadSessionId);
    await _requestSTTIfConsented(recording.serverRecordingId!);
  } catch (err) {
    if (err instanceof ApiError && err.isAlreadyCompleted) {
      // 서버 이미 완료 → done 처리 (D2 멱등)
      await database.write(async () => {
        await item.update((r) => { r.status = 'done'; r.updatedAt = Date.now(); });
      });
      store.clearPresignedUrl(item.uploadSessionId);
      await _requestSTTIfConsented(recording.serverRecordingId!);
    }
    // 그 외 에러: 다음 사이클에서 재시도
  }
}

async function _processItem(item: LocalUploadQueueModel): Promise<void> {
  const recCol = database.get<LocalRecordingModel>('local_recordings');
  const recording = await recCol.find(item.recordingId).catch(() => null);
  if (!recording?.serverRecordingId) return;

  // C3: 체크섬 없으면 서버 검증 실패 → 즉시 failed 처리 (재시도 불필요)
  if (!recording.checksumSha256) {
    await _markFailed(item, 'SHA-256 체크섬 누락 — 녹음 저장 시 계산 필요');
    return;
  }

  const store = useUploadQueueStore.getState();
  const sessionId = item.uploadSessionId;

  // S1: presigned URL 메모리에서 확인. 만료됐으면 서버에서 재발급.
  let presignedUrl: string;
  if (sessionId && store.isPresignedUrlValid(sessionId)) {
    presignedUrl = store.getPresignedUrl(sessionId)!.presignedUrl;
  } else {
    try {
      const session = await requestPresignedUrl(recording.serverRecordingId, {
        fileSizeBytes: recording.fileSizeBytes,
        checksumSha256: recording.checksumSha256,
      });
      // 메모리에만 저장 (S1)
      store.setPresignedUrl(session.upload_session_id, {
        uploadSessionId: session.upload_session_id,
        presignedUrl: session.presigned_url,
        expiresAt: session.expires_at * 1000,
      });
      presignedUrl = session.presigned_url;
      // DB에는 session ID만
      if (session.upload_session_id !== sessionId) {
        await database.write(async () => {
          await item.update((r) => {
            r.uploadSessionId = session.upload_session_id;
            r.updatedAt = Date.now();
          });
        });
      }
    } catch {
      await _markFailed(item, 'presigned URL 발급 실패');
      return;
    }
  }

  await database.write(async () => {
    await item.update((r) => { r.status = 'uploading'; r.updatedAt = Date.now(); });
  });

  try {
    await _doUpload(item, presignedUrl, recording);
  } catch (err) {
    // 업로드 전송 실패 → 재시도 또는 failed
    const attempts = item.attempts + 1;
    const safeError = err instanceof ApiError ? `HTTP_${err.status}` : 'NETWORK_ERROR';
    if (attempts >= MAX_UPLOAD_ATTEMPTS) {
      await _markFailed(item, safeError);
    } else {
      await database.write(async () => {
        await item.update((r) => {
          r.status = 'retrying';
          r.attempts = attempts;
          r.lastError = safeError;
          r.nextRetryAt = calcNextRetryAt(attempts);
          r.updatedAt = Date.now();
        });
      });
    }
    return;
  }

  // SR-C2: completing 단계 예외는 업로드 실패가 아님 — 다음 processQueue 사이클의 D2가 복구
  await database.write(async () => {
    await item.update((r) => { r.status = 'completing'; r.updatedAt = Date.now(); });
  });
  try {
    await _handleCompleting(item);
  } catch {
    // completing 상태 유지 → 앱 재시작 시 _drainQueue가 자동 복구 (D2)
  }
}

function _doUpload(
  item: LocalUploadQueueModel,
  presignedUrl: string,
  recording: LocalRecordingModel,
): Promise<void> {
  const store = useUploadQueueStore.getState();
  // W5: react-native-background-upload은 file:// prefix 없는 절대 경로를 요구
  const filePath = recording.filePath.replace(/^file:\/\//, '');
  // W1: progressMap 키를 서버 recording ID로 통일 (RecordingCard/Detail이 서버 ID로 조회)
  const progressKey = recording.serverRecordingId!;
  return new Promise((resolve, reject) => {
    Upload.startUpload({
      url: presignedUrl,
      path: filePath,
      method: 'PUT',
      type: 'raw',
      headers: { 'Content-Type': 'audio/m4a' },
      notification: {
        enabled: true,
        onProgressTitle: '업로드 중',
        onProgressMessage: `${recording.title} 업로드 중...`,
        onCompleteTitle: '업로드 완료',
        onCompleteMessage: recording.title,
        onErrorTitle: '업로드 실패',
        onErrorMessage: recording.title,
      },
    })
      .then((uploadId: string) => {
        Upload.addListener('progress', uploadId, (data: { loaded: number; total: number }) => {
          store.setProgress(progressKey, data.loaded, data.total);
          database.write(async () => {
            await item.update((r) => { r.bytesUploaded = data.loaded; });
          });
        });
        Upload.addListener('error', uploadId, (data: { error: string }) => {
          store.clearProgress(progressKey);
          reject(new Error(data.error));
        });
        Upload.addListener('completed', uploadId, () => {
          store.clearProgress(progressKey);
          resolve();
        });
      })
      .catch(reject);
  });
}

async function _markFailed(item: LocalUploadQueueModel, error: string): Promise<void> {
  await database.write(async () => {
    await item.update((r) => {
      r.status = 'failed';
      r.lastError = error;
      r.updatedAt = Date.now();
    });
  });
}

// S2: 국외이전 동의 확인 후 STT 요청
async function _requestSTTIfConsented(serverRecordingId: string): Promise<void> {
  const consented = await hasCrossBorderConsent();
  if (!consented) {
    // 동의 없으면 STT 요청 차단 — 사용자가 상세 화면에서 동의 후 수동 요청 (C2 경로)
    return;
  }
  await requestTranscription(serverRecordingId).catch((err) => {
    // W3: 409 = 이미 처리 중 (completing 복구 후 중복 호출) — 정상 케이스
    // 그 외 에러는 transcription_state로 별도 관리
    if (err?.status !== 409) {
      console.warn('[STT] 요청 실패:', err);
    }
  });
}

// FR-10: 수동 재전송 (upload 실패 전용)
export async function retryUpload(queueId: string): Promise<void> {
  const queueCol = database.get<LocalUploadQueueModel>('local_upload_queue');
  const item = await queueCol.find(queueId);
  if (!item || item.status !== 'failed') return;

  await database.write(async () => {
    await item.update((r) => {
      r.status = 'pending';
      r.attempts = 0; // 수동 재전송: attempts 리셋
      r.lastError = null;
      r.nextRetryAt = null;
      r.updatedAt = Date.now();
    });
  });
  processQueue();
}

// 새 파일 업로드 큐 등록
export async function enqueueUpload(params: {
  localRecordingId: string;
  bytesTotal: number;
}): Promise<void> {
  const queueCol = database.get<LocalUploadQueueModel>('local_upload_queue');
  await database.write(async () => {
    await queueCol.create((r) => {
      r.recordingId = params.localRecordingId;
      r.bytesTotal = params.bytesTotal;
      r.bytesUploaded = 0;
      r.attempts = 0;
      r.status = 'pending';
      r.createdAt = Date.now();
      r.updatedAt = Date.now();
    });
  });
  processQueue();
}
