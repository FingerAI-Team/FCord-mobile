import { AuthProvider, AuthSession, LoginCredentials, AuthError } from '../types';

// 가상 SSO. IBK 사양 수령 전까지 흐름 검증용.
// - SSO 버튼 → 1초 대기 → 가상 사용자 발급
// - 사번/비번 fallback → password === 'test1234'면 통과
// - access token 1시간 만료, refresh token 30일

const ACCESS_TTL_MS = 60 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MOCK_USERS: Record<string, { name: string; department: string; email: string }> = {
  '00001': { name: '김레오',     department: '디지털혁신본부', email: 'leo@ibk.test' },
  '00002': { name: '이테스트',   department: 'IB영업본부',     email: 'test@ibk.test' },
  '99999': { name: '관리자',     department: 'IT기획부',       email: 'admin@ibk.test' },
};
const DEFAULT_PASSWORD = 'test1234';

function randomToken(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

export interface MockSSOProviderOptions {
  /** 테스트에서 결정론을 원하면 주입. 기본은 Date.now() */
  now?: () => number;
  /** SSO 진입 시 인위적 지연 (UX 시뮬레이션용). ms */
  ssoDelayMs?: number;
}

export class MockSSOProvider implements AuthProvider {
  readonly name = 'mock-sso';
  private readonly now: () => number;
  private readonly ssoDelayMs: number;

  constructor(opts: MockSSOProviderOptions = {}) {
    this.now = opts.now ?? Date.now;
    this.ssoDelayMs = opts.ssoDelayMs ?? 800;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    if (credentials.kind === 'sso') {
      if (this.ssoDelayMs > 0) await delay(this.ssoDelayMs);
      // SSO는 항상 첫 번째 mock 유저로 들어옴 (실제 IdP 흐름에선 콜백에서 sub 추출)
      return this.makeSession('00001');
    }

    const profile = MOCK_USERS[credentials.employeeId];
    if (!profile || credentials.password !== DEFAULT_PASSWORD) {
      throw new AuthError('invalid_credentials', '사번 또는 비밀번호가 올바르지 않습니다.');
    }
    return this.makeSession(credentials.employeeId);
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    if (!refreshToken.startsWith('mock_refresh_')) {
      throw new AuthError('token_expired', 'refresh token이 유효하지 않습니다.');
    }
    // mock은 누구든 첫 번째 유저로 갱신 (실제 구현은 token에서 sub 디코드)
    return this.makeSession('00001');
  }

  async logout(_accessToken: string): Promise<void> {
    // mock 서버 없음 — no-op. 실제 구현은 IdP의 end_session_endpoint 호출.
    return;
  }

  private makeSession(employeeId: string): AuthSession {
    const profile = MOCK_USERS[employeeId];
    if (!profile) {
      throw new AuthError('unknown', `알 수 없는 사용자: ${employeeId}`);
    }
    const now = this.now();
    return {
      user: {
        id: employeeId,
        name: profile.name,
        department: profile.department,
        email: profile.email,
      },
      accessToken: randomToken('mock_access'),
      refreshToken: randomToken('mock_refresh'),
      expiresAt: now + ACCESS_TTL_MS,
      providerName: this.name,
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 화면에서 사용할 mock 자격증명 가이드 (DEV 빌드 LoginScreen에 노출)
export const MOCK_LOGIN_HINT = {
  employeeId: '00001',
  password: DEFAULT_PASSWORD,
  note: 'SSO 버튼은 즉시 통과. 사번/비번은 위 값 또는 00002/99999 사용.',
};
