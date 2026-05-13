import React from 'react';

export const Platform = { OS: 'ios' };
export const PermissionsAndroid = {
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS', RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
  RESULTS: { GRANTED: 'granted' },
};

// JSX 호환 컴포넌트 스텁
export const View = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('View', props);
export const ActivityIndicator = (props: Record<string, unknown>) =>
  React.createElement('ActivityIndicator', props);
export const Text = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('Text', props);
export const TouchableOpacity = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('TouchableOpacity', props);
export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
  flatten: (style: unknown) => style,
};
export const Alert = { alert: jest.fn() };

export default {
  Platform,
  PermissionsAndroid,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
};
