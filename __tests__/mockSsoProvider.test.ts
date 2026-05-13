import { MockSSOProvider } from '../src/auth/providers/mockSsoProvider';
import { AuthError } from '../src/auth/types';

describe('MockSSOProvider — login(sso)', () => {
  it('SSO 진입 시 가상 사용자(00001) 세션 발급', async () => {
    const fixedNow = 1_700_000_000_000;
    const provider = new MockSSOProvider({ now: () => fixedNow, ssoDelayMs: 0 });

    const session = await provider.login({ kind: 'sso' });

    expect(session.user.id).toBe('00001');
    expect(session.user.name).toBe('김레오');
    expect(session.providerName).toBe('mock-sso');
    expect(session.accessToken).toMatch(/^mock_access_/);
    expect(session.refreshToken).toMatch(/^mock_refresh_/);
    expect(session.expiresAt).toBe(fixedNow + 60 * 60 * 1000);
  });
});

describe('MockSSOProvider — login(password)', () => {
  const provider = new MockSSOProvider({ ssoDelayMs: 0 });

  it('정상 사번 + test1234 → 세션 발급', async () => {
    const session = await provider.login({
      kind: 'password',
      employeeId: '00002',
      password: 'test1234',
    });
    expect(session.user.id).toBe('00002');
    expect(session.user.name).toBe('이테스트');
  });

  it('잘못된 비밀번호 → AuthError(invalid_credentials)', async () => {
    await expect(
      provider.login({ kind: 'password', employeeId: '00001', password: 'wrong' }),
    ).rejects.toMatchObject({
      name: 'AuthError',
      code: 'invalid_credentials',
    });
  });

  it('등록되지 않은 사번 → AuthError(invalid_credentials)', async () => {
    await expect(
      provider.login({ kind: 'password', employeeId: '11111', password: 'test1234' }),
    ).rejects.toBeInstanceOf(AuthError);
  });
});

describe('MockSSOProvider — refresh', () => {
  const provider = new MockSSOProvider({ ssoDelayMs: 0 });

  it('mock_refresh_ 접두 토큰 → 새 세션 발급', async () => {
    const refreshed = await provider.refresh('mock_refresh_abc_123');
    expect(refreshed.accessToken).toMatch(/^mock_access_/);
    expect(refreshed.user.id).toBe('00001');
  });

  it('형식이 맞지 않는 refresh token → token_expired', async () => {
    await expect(provider.refresh('garbage')).rejects.toMatchObject({
      code: 'token_expired',
    });
  });
});

describe('MockSSOProvider — 토큰 만료', () => {
  it('expiresAt = now + 1h', async () => {
    const fixedNow = 1_700_000_000_000;
    const provider = new MockSSOProvider({ now: () => fixedNow, ssoDelayMs: 0 });
    const session = await provider.login({ kind: 'sso' });
    expect(session.expiresAt - fixedNow).toBe(3_600_000);
  });
});

describe('MockSSOProvider — logout', () => {
  it('서버 호출 없이 즉시 resolve (mock no-op)', async () => {
    const provider = new MockSSOProvider({ ssoDelayMs: 0 });
    await expect(provider.logout('any_token')).resolves.toBeUndefined();
  });
});
