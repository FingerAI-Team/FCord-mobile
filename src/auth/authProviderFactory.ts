import { AuthProvider } from './types';
import { MockSSOProvider } from './providers/mockSsoProvider';
import { IBKSSOProvider } from './providers/ibkSsoProvider';

// 빌드/런타임에 따라 인증 어댑터를 선택.
// - 기본: mock (현재 IBK SSO 사양 미수령)
// - process.env.AUTH_PROVIDER='ibk' 으로 전환 가능
//
// 실제 IBK 연동 시작 시:
//   1) .env에 AUTH_PROVIDER=ibk
//   2) IBK_SSO_AUTHORIZE_URL, IBK_SSO_TOKEN_EXCHANGE_URL 등 env 추가
//   3) 아래 buildIBK() 활성화

let cached: AuthProvider | null = null;

export function getAuthProvider(): AuthProvider {
  if (cached) return cached;

  const choice = (process.env.AUTH_PROVIDER ?? 'mock').toLowerCase();

  if (choice === 'ibk') {
    cached = buildIBK();
  } else {
    cached = new MockSSOProvider();
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
