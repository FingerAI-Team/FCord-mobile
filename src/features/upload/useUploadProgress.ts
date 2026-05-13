import { useEffect, useRef, useState } from 'react';
import { useUploadQueueStore } from '../../stores/uploadQueueStore';

interface UploadProgress {
  percent: number;
  bytesUploaded: number;
  bytesTotal: number;
  etaSeconds: number | null;
}

export function useUploadProgress(recordingId: string): UploadProgress {
  const progress = useUploadQueueStore((s) => s.progressMap[recordingId]);
  const startTimeRef = useRef<number>(Date.now());
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (!progress || progress.bytesTotal === 0) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const rate = elapsed > 0 ? progress.bytesUploaded / elapsed : 0;
    if (rate > 0) {
      setEta(Math.ceil((progress.bytesTotal - progress.bytesUploaded) / rate));
    }
  }, [progress]);

  if (!progress) {
    return { percent: 0, bytesUploaded: 0, bytesTotal: 0, etaSeconds: null };
  }

  const percent =
    progress.bytesTotal > 0
      ? Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
      : 0;

  return { percent, bytesUploaded: progress.bytesUploaded, bytesTotal: progress.bytesTotal, etaSeconds: eta };
}
