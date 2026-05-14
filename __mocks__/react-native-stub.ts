export default {};
export const Platform = { OS: 'ios' };
export const PermissionsAndroid = { check: jest.fn(), request: jest.fn(), PERMISSIONS: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' }, RESULTS: { GRANTED: 'granted' } };

// react-native-permissions 필요 API
export const check = jest.fn(async () => 'granted');
export const request = jest.fn(async () => 'granted');
export const PERMISSIONS = {
  IOS: { MICROPHONE: 'ios.permission.MICROPHONE' },
  ANDROID: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
};
export const RESULTS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
  LIMITED: 'limited',
};

// react-native-keychain용 fallback 시그니처 (ts-jest 타입 체크).
// 실제 런타임은 __mocks__/react-native-keychain.ts가 먼저 매칭되어 사용된다.
type _Stored = { username: string; password: string };
export const getGenericPassword = jest.fn(
  async (_opts?: { service?: string }): Promise<_Stored | false> => false,
);
export const setGenericPassword = jest.fn(
  async (_u: string, _p: string, opts?: { service?: string }): Promise<{ service: string }> => ({
    service: opts?.service ?? '',
  }),
);
export const resetGenericPassword = jest.fn(
  async (_opts?: { service?: string }): Promise<boolean> => true,
);
