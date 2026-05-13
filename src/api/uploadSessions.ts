import { apiRequest } from './client';

interface UploadSessionResponse {
  upload_session_id: string;
  presigned_url: string;
  expires_at: number; // UNIX timestamp (seconds)
}

export async function requestPresignedUrl(
  recordingId: string,
  meta: { fileSizeBytes: number; checksumSha256: string },
): Promise<UploadSessionResponse> {
  return apiRequest('POST', `/v1/recordings/${recordingId}/upload-sessions`, {
    file_size_bytes: meta.fileSizeBytes,
    checksum_sha256: meta.checksumSha256,
  });
}

export async function completeUploadSession(
  uploadSessionId: string,
  checksumSha256: string,
  bytesUploaded: number,
): Promise<void> {
  await apiRequest('POST', `/v1/upload-sessions/${uploadSessionId}/complete`, {
    checksum_sha256: checksumSha256,
    bytes_uploaded: bytesUploaded,
  });
}
