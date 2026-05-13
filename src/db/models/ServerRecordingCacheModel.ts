import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class ServerRecordingCacheModel extends Model {
  static table = 'server_recording_cache';

  @field('title') title!: string;
  @field('note') note!: string | null;
  @field('tags') tags!: string; // JSON string
  @field('language_hint') languageHint!: string | null;
  @field('duration_ms') durationMs!: number | null;
  @field('file_size_bytes') fileSizeBytes!: number | null;
  @field('upload_state') uploadState!: string;
  @field('transcription_state') transcriptionState!: string;
  @field('recording_state') recordingState!: string;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('transcript_preview') transcriptPreview!: string | null;
  @field('cached_at') cachedAt!: number;
}
