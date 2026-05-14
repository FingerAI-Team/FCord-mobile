import React from 'react';

// react-native-background-upload, @react-native-community/netinfo 등
// 네이티브 모듈의 default export stub
export default {
  // NetInfo: 콜백 파라미터는 any — 실제 NetInfoState 타입 설치 없이 타입체크 통과
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener: jest.fn((_callback: (state: any) => void) => jest.fn()),
  startUpload: jest.fn().mockResolvedValue('upload-id'),  // Upload
  // Upload.addListener: (event, uploadId, callback) — callback data는 any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addListener: jest.fn((_event: string, _id: string, _cb: (data: any) => void) => ({ remove: jest.fn() })),
};

export const Platform = { OS: 'ios' };
export const PermissionsAndroid = {
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
  RESULTS: { GRANTED: 'granted' },
};

// react-native-permissions 필요 API
export const check = jest.fn(async (_permission: string) => 'granted');
export const request = jest.fn(async (_permission: string) => 'granted');
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

// react-native-gesture-handler
export const Swipeable = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('Swipeable', props);
export const GestureHandlerRootView = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('GestureHandlerRootView', props);

// react-native-keychain용 fallback 시그니처 (ts-jest 타입 체크).
// 실제 런타임은 __mocks__/react-native-keychain.ts가 먼저 매칭되어 사용된다.
type _Stored = { username: string; password: string };
export const getGenericPassword = jest.fn(
  async (_opts?: { service?: string }): Promise<_Stored | false> => false,
);
export const setGenericPassword = jest.fn(
  async (_u: string, _p: string, opts?: { service?: string; accessControl?: string }): Promise<{ service: string }> => ({
    service: opts?.service ?? '',
  }),
);
export const resetGenericPassword = jest.fn(
  async (_opts?: { service?: string }): Promise<boolean> => true,
);
