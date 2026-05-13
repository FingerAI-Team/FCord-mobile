// 상태 → 라우트 매핑 순수 함수 (JSX 없는 순수 TS — 테스트 가능)
export type AuthRoute = 'loading' | 'auth' | 'main';

export function resolveAuthRoute(status: 'booting' | 'anonymous' | 'authed'): AuthRoute {
  if (status === 'booting') return 'loading';
  if (status === 'anonymous') return 'auth';
  return 'main';
}
