import { create } from 'zustand';
import {
  AuthSession,
  LoginCredentials,
  AuthError,
  getAuthProvider,
  tokenStorage,
} from '../auth';
import { setSessionExpiredHandler } from '../api/client';

// 부팅 상태:
//   booting   — Keychain 조회 중 (Splash 표시)
//   anonymous — 미로그인 (LoginScreen)
//   authed    — 로그인 (MainStack)
type AuthStatus = 'booting' | 'anonymous' | 'authed';

interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: AuthError | null;
  isSubmitting: boolean;

  /** 앱 부팅 시 1회 호출 — 저장된 세션 복원 */
  bootstrap: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'booting',
  session: null,
  error: null,
  isSubmitting: false,

  bootstrap: async () => {
    set({ status: 'booting', error: null });
    try {
      const saved = await tokenStorage.loadSession();
      if (!saved) {
        // __DEV__ + mock provider: 자동 로그인으로 UI 검증 지원
        if (typeof __DEV__ !== 'undefined' && __DEV__ && getAuthProvider().name === 'mock-sso') {
          try {
            const session = await getAuthProvider().login({ kind: 'sso' });
            await tokenStorage.saveSession(session);
            set({ status: 'authed', session });
          } catch {
            set({ status: 'anonymous', session: null });
          }
          return;
        }
        set({ status: 'anonymous', session: null });
        return;
      }

      // 만료 임박 시 refresh 시도. 실패하면 anonymous로 떨어뜨린다.
      if (tokenStorage.isExpiredOrSoon(saved)) {
        try {
          const refreshed = await getAuthProvider().refresh(saved.refreshToken);
          await tokenStorage.saveSession(refreshed);
          set({ status: 'authed', session: refreshed });
          return;
        } catch {
          await tokenStorage.clear();
          set({ status: 'anonymous', session: null });
          return;
        }
      }

      set({ status: 'authed', session: saved });
    } catch {
      set({ status: 'anonymous', session: null });
    }
  },

  login: async (credentials) => {
    set({ isSubmitting: true, error: null });
    try {
      const session = await getAuthProvider().login(credentials);
      await tokenStorage.saveSession(session);
      set({ status: 'authed', session, isSubmitting: false, error: null });
    } catch (e) {
      const err =
        e instanceof AuthError
          ? e
          : new AuthError('unknown', e instanceof Error ? e.message : '로그인 실패');
      set({ isSubmitting: false, error: err });
    }
  },

  logout: async () => {
    const current = get().session;
    // best-effort: 서버 logout 실패해도 로컬 토큰은 반드시 지운다
    if (current) {
      try {
        await getAuthProvider().logout(current.accessToken);
      } catch {
        /* swallow */
      }
    }
    await tokenStorage.clear();
    set({ status: 'anonymous', session: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

// API 호출 중 401 수신 시 → 로컬 세션 삭제 후 로그인 화면으로 전환
setSessionExpiredHandler(async () => {
  await tokenStorage.clear();
  useAuthStore.setState({ status: 'anonymous', session: null, error: null });
});
