// @react-navigation/stack 테스트 대역 — createStackNavigator mock 제공
import React from 'react';

export const createStackNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));
