import { useAuthStore } from '../src/stores/authStore';

describe('authStore.logout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'authed',
      session: {
        user: { id: '12345', name: '홍길동', department: '기술부' },
        accessToken: 'mock-access',
        refreshToken: 'mock-refresh',
        expiresAt: Date.now() + 3600_000,
        providerName: 'mock-sso',
      },
      error: null,
      isSubmitting: false,
    });
  });

  it('logout 호출 후 status가 anonymous가 된다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('logout 후 session이 null이 된다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it('logout 후 error가 null이다', async () => {
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
