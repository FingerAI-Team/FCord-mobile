import React from 'react';
import { View } from 'react-native';

// SafeAreaView: 테스트 환경에서는 일반 View로 대체
export const SafeAreaView = View as React.ComponentType<Record<string, unknown>>;

// SafeAreaProvider: 자식 그대로 렌더 (테스트용)
export function SafeAreaProvider({ children }: React.PropsWithChildren<unknown>): React.ReactElement {
  return React.createElement(React.Fragment, null, children);
}

// useSafeAreaInsets: iPhone 기본 safe area 값 반환
export function useSafeAreaInsets() {
  return { top: 44, bottom: 34, left: 0, right: 0 };
}

// useSafeAreaFrame: 기본 화면 크기
export function useSafeAreaFrame() {
  return { x: 0, y: 0, width: 390, height: 844 };
}

export const SafeAreaConsumer = SafeAreaProvider;
export const initialWindowMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 44, bottom: 34, left: 0, right: 0 },
};
