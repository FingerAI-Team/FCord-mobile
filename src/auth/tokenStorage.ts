import * as Keychain from 'react-native-keychain';
import { AuthSession, AuthUser } from './types';

// Keychain 서비스 키 — 평문 저장 금지 (가드레일).
// 기존 src/api/client.ts가 'ibk_stt_access_token'을 직접 읽고 있어 호환 유지.
const ACCESS_TOKEN_SERVICE = 'ibk_stt_access_token';
const REFRESH_TOKEN_SERVICE = 'ibk_stt_refresh_token';
const SESSION_META_SERVICE = 'ibk_stt_session_meta'; // user + expiresAt (JSON)

interface SessionMeta {
  user: AuthUser;
  expiresAt: number;
  providerName: string;
}

export const tokenStorage = {
  async saveSession(session: AuthSession): Promise<void> {
    const meta: SessionMeta = {
      user: session.user,
      expiresAt: session.expiresAt,
      providerName: session.providerName,
    };
    await Promise.all([
      Keychain.setGenericPassword('access', session.accessToken, { service: ACCESS_TOKEN_SERVICE }),
      Keychain.setGenericPassword('refresh', session.refreshToken, { service: REFRESH_TOKEN_SERVICE }),
      Keychain.setGenericPassword('meta', JSON.stringify(meta), { service: SESSION_META_SERVICE }),
    ]);
  },

  async loadSession(): Promise<AuthSession | null> {
    const [accessRes, refreshRes, metaRes] = await Promise.all([
      Keychain.getGenericPassword({ service: ACCESS_TOKEN_SERVICE }),
      Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE }),
      Keychain.getGenericPassword({ service: SESSION_META_SERVICE }),
    ]);

    if (!accessRes || !refreshRes || !metaRes) return null;

    try {
      const meta = JSON.parse(metaRes.password) as SessionMeta;
      return {
        user: meta.user,
        accessToken: accessRes.password,
        refreshToken: refreshRes.password,
        expiresAt: meta.expiresAt,
        providerName: meta.providerName,
      };
    } catch {
      // 메타 손상 시 전체 클리어 (안전 default)
      await tokenStorage.clear();
      return null;
    }
  },

  async getAccessToken(): Promise<string | null> {
    const res = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_SERVICE });
    return res ? res.password : null;
  },

  async getRefreshToken(): Promise<string | null> {
    const res = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    return res ? res.password : null;
  },

  async clear(): Promise<void> {
    // 일부 실패해도 나머지는 지운다 (로그아웃은 best-effort)
    await Promise.allSettled([
      Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE }),
      Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE }),
      Keychain.resetGenericPassword({ service: SESSION_META_SERVICE }),
    ]);
  },

  /** 만료 임박(60초 이내) 또는 만료됨 */
  isExpiredOrSoon(session: AuthSession, nowMs: number = Date.now()): boolean {
    return session.expiresAt - nowMs < 60_000;
  },
};
