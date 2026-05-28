// FAICORD 인증 어댑터 (https://faicord.fingerservice.co.kr)
// username/password → UUID 토큰 발급 → token 헤더로 API 호출
import { AuthProvider, AuthSession, AuthError, LoginCredentials } from '../types';

const FAICORD_BASE = 'https://faicord.fingerservice.co.kr';

export class FAICORDAuthProvider implements AuthProvider {
  readonly name = 'faicord';

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const username =
      credentials.kind === 'password' ? credentials.employeeId : 'sso';

    if (credentials.kind === 'sso') {
      throw new AuthError(
        'sso_unavailable',
        'FAICORD는 사번/비밀번호로 로그인해주세요.',
      );
    }

    let data: any;
    try {
      const res = await fetch(`${FAICORD_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: credentials.password,
        }),
        credentials: 'include',
      });
      data = await res.json();
    } catch {
      throw new AuthError('network_error', '서버에 연결할 수 없습니다.');
    }

    if (!data.success || !data.token) {
      throw new AuthError(
        'invalid_credentials',
        data.message ?? '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    return {
      user: {
        id: data.user.username,
        name: data.user.name,
        department: undefined,
      },
      accessToken: data.token,
      refreshToken: data.token,
      // FAICORD 세션은 서버가 관리 → 앱은 1년으로 길게 설정
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      providerName: 'faicord',
    };
  }

  async refresh(_refreshToken: string): Promise<AuthSession> {
    // FAICORD는 refresh 엔드포인트 없음 → 재로그인 유도
    throw new AuthError('token_expired', '세션이 만료되었습니다. 다시 로그인해주세요.');
  }

  async logout(accessToken: string): Promise<void> {
    await fetch(`${FAICORD_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token: accessToken },
      credentials: 'include',
    }).catch(() => {});
  }
}
