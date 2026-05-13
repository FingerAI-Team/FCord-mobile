import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

// presigned_url 필드 없음 — 메모리(Zustand)에만 보관 (S1 보안 fix)
export class LocalUploadQueueModel extends Model {
  static table = 'local_upload_queue';

  @field('recording_id') recordingId!: string;
  @field('upload_session_id') uploadSessionId!: string | null;
  @field('bytes_total') bytesTotal!: number;
  @field('bytes_uploaded') bytesUploaded!: number;
  @field('attempts') attempts!: number;
  @field('last_error') lastError!: string | null;
  @field('next_retry_at') nextRetryAt!: number | null;
  @field('status') status!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
}
