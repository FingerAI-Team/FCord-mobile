// @react-navigation/bottom-tabs 테스트 대역 — createBottomTabNavigator mock 제공
import React from 'react';

export const createBottomTabNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));
