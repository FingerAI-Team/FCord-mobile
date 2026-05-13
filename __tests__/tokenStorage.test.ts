import { tokenStorage } from '../src/auth/tokenStorage';
import { AuthSession } from '../src/auth/types';
import { __resetKeychainStore } from '../__mocks__/react-native-keychain';

const sampleSession: AuthSession = {
  user: { id: '00001', name: '김레오', department: '디지털혁신본부', email: 'leo@ibk.test' },
  accessToken: 'mock_access_abc',
  refreshToken: 'mock_refresh_abc',
  expiresAt: Date.now() + 60 * 60 * 1000,
  providerName: 'mock-sso',
};

describe('tokenStorage', () => {
  beforeEach(() => {
    __resetKeychainStore();
  });

  it('saveSession → loadSession 라운드트립', async () => {
    await tokenStorage.saveSession(sampleSession);
    const loaded = await tokenStorage.loadSession();
    expect(loaded).toEqual(sampleSession);
  });

  it('clear 후 loadSession = null', async () => {
    await tokenStorage.saveSession(sampleSession);
    await tokenStorage.clear();
    const loaded = await tokenStorage.loadSession();
    expect(loaded).toBeNull();
  });

  it('getAccessToken은 access_token만 반환', async () => {
    await tokenStorage.saveSession(sampleSession);
    expect(await tokenStorage.getAccessToken()).toBe('mock_access_abc');
  });

  it('isExpiredOrSoon: 60초 마진', () => {
    const now = 1_700_000_000_000;
    expect(tokenStorage.isExpiredOrSoon({ ...sampleSession, expiresAt: now + 30_000 }, now)).toBe(true);
    expect(tokenStorage.isExpiredOrSoon({ ...sampleSession, expiresAt: now + 120_000 }, now)).toBe(false);
    expect(tokenStorage.isExpiredOrSoon({ ...sampleSession, expiresAt: now - 1 }, now)).toBe(true);
  });

  it('메타 키 손상 시 자동 클리어 후 null 반환', async () => {
    await tokenStorage.saveSession(sampleSession);
    // 메타만 잘못된 JSON으로 덮음 — 런타임은 keychain mock 사용
    const Keychain = await import('react-native-keychain');
    await Keychain.setGenericPassword('meta', '{not_json', { service: 'ibk_stt_session_meta' });

    const loaded = await tokenStorage.loadSession();
    expect(loaded).toBeNull();
    expect(await tokenStorage.getAccessToken()).toBeNull();
  });
});
