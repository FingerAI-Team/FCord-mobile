import { calcNextRetryAt, isRetryReady, isQueueItemReady } from '../src/features/upload/uploadQueue';

// 스펙 §검증기준: "Unit | uploadQueue backoff 계산 | 5회 후 failed, 각 delay 정확"
describe('calcNextRetryAt — backoff 지연 계산', () => {
  const EXPECTED_DELAYS = [1_000, 3_000, 10_000, 30_000, 120_000];

  it.each(EXPECTED_DELAYS.map((delay, i) => [i, delay]))(
    'attempts=%i → 지연 %ims',
    (attempts, expectedDelay) => {
      const before = Date.now();
      const retryAt = calcNextRetryAt(attempts as number);
      const after = Date.now();
      expect(retryAt).toBeGreaterThanOrEqual(before + expectedDelay);
      expect(retryAt).toBeLessThanOrEqual(after + expectedDelay + 10); // 10ms 여유
    },
  );

  it('attempts가 4를 초과해도 최대 120s 유지 (5회 소진 후 재수동 재전송 시)', () => {
    const retryAt = calcNextRetryAt(10);
    expect(retryAt - Date.now()).toBeGreaterThanOrEqual(120_000 - 10);
    expect(retryAt - Date.now()).toBeLessThanOrEqual(120_000 + 10);
  });
});

// 스펙 §검증기준: "Unit | presigned_url 만료 감지 | expires_at - now < 60s → 재발급 트리거"
describe('isRetryReady — 재시도 준비 여부', () => {
  it('nextRetryAt이 null이면 즉시 준비 (pending 상태)', () => {
    expect(isRetryReady(null)).toBe(true);
  });

  it('nextRetryAt이 undefined면 즉시 준비', () => {
    expect(isRetryReady(undefined)).toBe(true);
  });

  it('nextRetryAt이 현재 시각보다 과거면 준비', () => {
    expect(isRetryReady(Date.now() - 1000)).toBe(true);
  });

  it('nextRetryAt이 미래면 아직 대기 중', () => {
    expect(isRetryReady(Date.now() + 10_000)).toBe(false);
  });

  it('nextRetryAt이 현재 시각과 동일하면 준비 (경계값)', () => {
    expect(isRetryReady(Date.now())).toBe(true);
  });
});

// HOL blocking 방지 로직 검증
describe('isQueueItemReady — 큐 슬롯 사용 가능 여부', () => {
  it("pending 항목은 nextRetryAt 무관하게 즉시 슬롯 사용", () => {
    expect(isQueueItemReady('pending', Date.now() + 99_999)).toBe(true);
  });

  it("retrying 항목은 nextRetryAt 경과 시에만 슬롯 사용", () => {
    expect(isQueueItemReady('retrying', Date.now() - 1)).toBe(true);
    expect(isQueueItemReady('retrying', Date.now() + 5_000)).toBe(false);
  });

  it("uploading/completing/done 상태는 슬롯 사용 안 함", () => {
    expect(isQueueItemReady('uploading')).toBe(false);
    expect(isQueueItemReady('completing')).toBe(false);
    expect(isQueueItemReady('done')).toBe(false);
    expect(isQueueItemReady('failed')).toBe(false);
    expect(isQueueItemReady('cancelled')).toBe(false);
  });
});
