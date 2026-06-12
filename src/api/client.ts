import { tokenStorage } from '../auth/tokenStorage';

// FAICORD 실서버. AUTH_PROVIDER=mock 시에도 이 URL을 바라보되 토큰이 없으면 에러.
export const BASE_URL =
  process.env.API_BASE_URL ?? 'https://faicord.fingerservice.co.kr';

// authStore에서 등록 — 401 수신 시 로컬 세션을 지우고 로그인 화면으로 전환
let _onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: () => void) {
  _onSessionExpired = fn;
}

const API_TIMEOUT_MS = 15_000;

async function getAccessToken(): Promise<string | null> {
  return tokenStorage.getAccessToken();
}

function withTimeout(signal?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  // 외부 signal이 abort되면 내부도 abort
  signal?.addEventListener('abort', () => controller.abort());
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getAccessToken();
  const { signal, clear } = withTimeout();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // 백엔드는 sessionid 쿠키로만 인증 — RN은 쿠키 자동 전송 안 되므로 명시적으로 설정
        ...(token ? { token, Cookie: `sessionid=${token}` } : {}),
      },
      credentials: 'include',
      body: body != null ? JSON.stringify(body) : undefined,
      signal,
    });

    if (res.status === 401) {
      _onSessionExpired?.();
      throw new ApiError(401, 'SESSION_EXPIRED');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(res.status, text);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ApiError(0, 'TIMEOUT');
    throw e;
  } finally {
    clear();
  }
}

// multipart 파일 업로드 전용 (FAICORD POST /api/meetings/upload)
// FAICORD 업로드는 sessionid 쿠키 인증 필요 — token 헤더 미지원
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = await getAccessToken();
  const { signal, clear } = withTimeout();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        ...(token ? { token, Cookie: `sessionid=${token}` } : {}),
      },
      credentials: 'include',
      body: formData,
      signal,
    });

    if (res.status === 401) {
      _onSessionExpired?.();
      throw new ApiError(401, 'SESSION_EXPIRED');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new ApiError(res.status, text);
    }
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new ApiError(0, 'TIMEOUT');
    throw e;
  } finally {
    clear();
  }
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }

  get isAlreadyCompleted(): boolean {
    return this.status === 409;
  }
}
