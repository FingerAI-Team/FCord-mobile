export const Platform = { OS: 'ios' };
export const PermissionsAndroid = {
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS', RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
  RESULTS: { GRANTED: 'granted' },
};
export default { Platform, PermissionsAndroid };
