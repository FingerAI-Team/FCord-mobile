import { appSchema, tableSchema } from '@nozbe/watermelondb';

// presigned_url 컬럼 없음 (S1 보안 fix: URL은 메모리 전용)
export const dbSchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'local_recordings',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'draft_state', type: 'string' },
        { name: 'file_path', type: 'string' },
        { name: 'duration_ms', type: 'number' },
        { name: 'file_size_bytes', type: 'number' },
        { name: 'checksum_sha256', type: 'string' },
        { name: 'server_recording_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'local_upload_queue',
      columns: [
        { name: 'recording_id', type: 'string', isIndexed: true },
        { name: 'upload_session_id', type: 'string', isOptional: true },
        // presigned_url 컬럼 없음 (S1)
        { name: 'bytes_total', type: 'number' },
        { name: 'bytes_uploaded', type: 'number' },
        { name: 'attempts', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'next_retry_at', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'server_recording_cache',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'tags', type: 'string' }, // JSON 직렬화
        { name: 'language_hint', type: 'string', isOptional: true },
        { name: 'duration_ms', type: 'number', isOptional: true },
        { name: 'file_size_bytes', type: 'number', isOptional: true },
        { name: 'upload_state', type: 'string' },
        { name: 'transcription_state', type: 'string' },
        { name: 'recording_state', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'transcript_preview', type: 'string', isOptional: true },
        { name: 'cached_at', type: 'number' },
      ],
    }),
  ],
});
