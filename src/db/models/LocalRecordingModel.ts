import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class LocalRecordingModel extends Model {
  static table = 'local_recordings';

  @field('title') title!: string;
  @field('draft_state') draftState!: string;
  @field('file_path') filePath!: string;
  @field('duration_ms') durationMs!: number;
  @field('file_size_bytes') fileSizeBytes!: number;
  @field('checksum_sha256') checksumSha256!: string;
  @field('server_recording_id') serverRecordingId!: string | null;
  @field('created_at') createdAt!: number;
}
