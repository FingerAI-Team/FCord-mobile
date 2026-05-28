import { AuthProvider } from './types';
import { MockSSOProvider } from './providers/mockSsoProvider';
import { IBKSSOProvider } from './providers/ibkSsoProvider';
import { FAICORDAuthProvider } from './providers/faicordAuthProvider';

// AUTH_PROVIDER env:
//   'faicord' (기본) — faicord.fingerservice.co.kr 실서버 연동
//   'mock'          — 로컬 목 로그인 (서버 불필요)
//   'ibk'           — IBK SSO (사양 수령 후)

let cached: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (cached) return cached;

  const choice = (process.env.AUTH_PROVIDER ?? 'faicord').toLowerCase();

  if (choice === 'ibk') {
    cached = buildIBK();
  } else if (choice === 'mock') {
    cached = new MockSSOProvider();
  } else {
    cached = new FAICORDAuthProvider();
  }
  return cached;
}

/** 테스트에서 강제 주입할 때 사용 */
export function __setAuthProvider(provider: AuthProvider | null): void {
  cached = provider;
}

function buildIBK(): IBKSSOProvider {
  return new IBKSSOProvider({
    authorizeUrl: process.env.IBK_SSO_AUTHORIZE_URL ?? '',
    tokenExchangeUrl: process.env.IBK_SSO_TOKEN_EXCHANGE_URL ?? '',
    userInfoUrl: process.env.IBK_SSO_USERINFO_URL ?? '',
    redirectUri: process.env.IBK_SSO_REDIRECT_URI ?? 'ibkstt://auth/callback',
    clientId: process.env.IBK_SSO_CLIENT_ID ?? '',
  });
}
