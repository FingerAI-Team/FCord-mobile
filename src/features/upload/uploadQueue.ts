// 업로드 큐 상태기계 헬퍼

const BACKOFF_DELAYS_MS = [1_000, 3_000, 10_000, 30_000, 120_000];

export function calcNextRetryAt(attempts: number): number {
  const delay = BACKOFF_DELAYS_MS[Math.min(attempts, BACKOFF_DELAYS_MS.length - 1)];
  return Date.now() + delay;
}

export function isRetryReady(nextRetryAt: number | null | undefined): boolean {
  if (nextRetryAt == null) return true;
  return Date.now() >= nextRetryAt;
}

// C2: HOL blocking 방지 — pending은 즉시, retrying은 next_retry_at 경과 시만 슬롯 사용
export function isQueueItemReady(status: string, nextRetryAt?: number | null): boolean {
  if (status === 'pending') return true;
  if (status === 'retrying') return isRetryReady(nextRetryAt);
  return false;
}
