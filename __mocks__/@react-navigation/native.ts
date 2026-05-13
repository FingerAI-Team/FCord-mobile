// @react-navigation/native 테스트 대역 — useNavigation, useRoute, NavigationContainer 제공
import React from 'react';

// 단일 인스턴스 공유 — 테스트에서 참조 동일성 보장
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
};

export const useNavigation = jest.fn(() => mockNavigation);
export { mockNavigation };
export const useRoute = jest.fn(() => ({ params: {} }));
export const NavigationContainer = ({ children }: { children: React.ReactNode }): React.ReactElement => (
  <>{children}</>
);
