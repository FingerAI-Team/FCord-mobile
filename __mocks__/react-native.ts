import React from 'react';

// 타입 alias — tokens.ts 등에서 import해 사용
export type TextStyle = Record<string, unknown>;
export type ViewStyle = Record<string, unknown>;
export type ImageStyle = Record<string, unknown>;

export const Platform = { OS: 'ios' };
export const Dimensions = {
  get: (_dim: string) => ({ width: 375, height: 812 }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// ListRenderItem 타입 export
export type ListRenderItem<T> = (info: { item: T; index: number }) => React.ReactElement | null;
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
export const Switch = (props: Record<string, unknown>) =>
  React.createElement('Switch', props);
export const TextInput = (props: Record<string, unknown>) =>
  React.createElement('TextInput', props);
export const FlatList = (props: Record<string, unknown>) =>
  React.createElement('FlatList', props);
export const SectionList = (props: Record<string, unknown>) =>
  React.createElement('SectionList', props);
export const ScrollView = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('ScrollView', props);
export const Modal = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('Modal', props);
export const KeyboardAvoidingView = (props: React.PropsWithChildren<Record<string, unknown>>) =>
  React.createElement('KeyboardAvoidingView', props);
export const Animated = {
  View: (props: React.PropsWithChildren<Record<string, unknown>>) =>
    React.createElement('Animated.View', props),
  Value: jest.fn().mockImplementation((v: number) => ({ _value: v, setValue: jest.fn() })),
  timing: jest.fn((_value: unknown, _config: unknown) => ({ start: jest.fn(), stop: jest.fn() })),
  sequence: jest.fn((_anims: unknown) => ({ start: jest.fn(), stop: jest.fn() })),
  loop: jest.fn((_anim: unknown) => ({ start: jest.fn(), stop: jest.fn() })),
};

export default {
  Platform,
  Dimensions,
  PermissionsAndroid,
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  TextInput,
  FlatList,
  SectionList,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Animated,
};
