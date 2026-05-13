import { tokenStorage } from '../auth/tokenStorage';

const BASE_URL = process.env.API_BASE_URL ?? 'https://api.ibk-stt.internal';

// 토큰은 Keychain에서만 조회 — AsyncStorage 평문 저장 금지 (가드레일).
// 저장/조회 로직은 src/auth/tokenStorage.ts에 일원화.
async function getAccessToken(): Promise<string | null> {
  return tokenStorage.getAccessToken();
}

export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text);
  }

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }

  // D2: 서버가 이미 complete 처리한 경우 (멱등성 처리용)
  get isAlreadyCompleted(): boolean {
    return this.status === 409;
  }
}
