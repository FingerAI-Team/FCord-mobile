// AuthGate 라우팅 결정 로직 테스트 (상태 → 스택 매핑)
// resolveAuthRoute는 순수 함수로 분리되어 JSX 없이 테스트 가능
import { resolveAuthRoute } from '../src/navigation/resolveAuthRoute';

describe('resolveAuthRoute', () => {
  it('booting 상태에서는 loading을 반환한다', () => {
    expect(resolveAuthRoute('booting')).toBe('loading');
  });

  it('anonymous 상태에서는 auth를 반환한다', () => {
    expect(resolveAuthRoute('anonymous')).toBe('auth');
  });

  it('authed 상태에서는 main을 반환한다', () => {
    expect(resolveAuthRoute('authed')).toBe('main');
  });
});
