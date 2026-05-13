import { AuthProvider, AuthSession, LoginCredentials, AuthError } from '../types';

// IBK투자증권 SSO 어댑터 — IdP 사양 수령 시 구현.
// 예상 흐름:
//   1) login(sso) → InAppBrowser 또는 ASWebAuthenticationSession으로 IdP 진입
//   2) deeplink callback (ibkstt://auth/callback?code=...) 수신
//   3) authorization code → token exchange (서버 BFF 경유 권장, 클라에 client_secret 두지 말 것)
//   4) /userinfo로 사번·부서 조회 → AuthSession 조립
//
// 보안 노트:
// - PKCE 필수 (code_verifier는 메모리, code_challenge만 query)
// - state 파라미터로 CSRF 방어
// - id_token 서명 검증은 서버 BFF가 처리 (클라에서 JWKS 캐싱 부담 회피)

export interface IBKSSOProviderConfig {
  /** IdP authorize endpoint */
  authorizeUrl: string;
  /** BFF 토큰 교환 엔드포인트 (서버측. 클라가 직접 IdP의 /token을 치지 않는다) */
  tokenExchangeUrl: string;
  /** BFF 사용자 정보 엔드포인트 */
  userInfoUrl: string;
  /** OAuth 콜백 deep link scheme */
  redirectUri: string;
  clientId: string;
}

export class IBKSSOProvider implements AuthProvider {
  readonly name = 'ibk-sso';

  // 의도적으로 unused 표시 — 실제 구현 시 사용
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly _config: IBKSSOProviderConfig) {}

  async login(_credentials: LoginCredentials): Promise<AuthSession> {
    throw new AuthError(
      'sso_unavailable',
      'IBK SSO 어댑터 미구현. IdP 사양(authorize/token/userinfo + redirectUri) 수령 후 구현 예정.',
    );
  }

  async refresh(_refreshToken: string): Promise<AuthSession> {
    throw new AuthError('sso_unavailable', 'IBK SSO refresh 미구현.');
  }

  async logout(_accessToken: string): Promise<void> {
    throw new AuthError('sso_unavailable', 'IBK SSO logout 미구현.');
  }
}
