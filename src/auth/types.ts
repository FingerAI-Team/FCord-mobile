// 인증 어댑터 인터페이스 — IBK SSO 사양 수령 시 IBKSSOProvider만 갈아끼우면 끝
// 가드레일: STT처럼 인증도 vendor-agnostic (provider만 교체 가능 구조)

export interface AuthUser {
  id: string;            // 사번 (employeeId)
  name: string;
  department?: string;
  email?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;     // epoch ms
  providerName: string;  // 'mock-sso' | 'ibk-sso' (감사용)
}

export type LoginCredentials =
  | { kind: 'sso' }                                          // SSO 진입 (mock은 즉시 통과)
  | { kind: 'password'; employeeId: string; password: string }; // fallback

export interface AuthProvider {
  /** 어댑터 식별자 (감사 로그·UI 표시용) */
  readonly name: string;

  /** 로그인 수행 → AuthSession 반환. 실패 시 AuthError throw */
  login(credentials: LoginCredentials): Promise<AuthSession>;

  /** refreshToken으로 새 세션 발급. 실패 시 AuthError throw (만료/취소 포함) */
  refresh(refreshToken: string): Promise<AuthSession>;

  /** 서버측 세션 무효화 (실패해도 로컬 토큰은 항상 지운다 — 호출부 책임) */
  logout(accessToken: string): Promise<void>;
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'sso_cancelled'
  | 'sso_unavailable'
  | 'token_expired'
  | 'network_error'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
