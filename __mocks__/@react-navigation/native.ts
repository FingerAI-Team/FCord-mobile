import React from 'react';

export const useNavigation = jest.fn(() => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
}));

export const useRoute = jest.fn(() => ({ params: {} }));

export const NavigationContainer = ({ children }: { children: React.ReactNode }) => children;

export const createStackNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));

export const createBottomTabNavigator = jest.fn(() => ({
  Navigator: ({ children }: { children: React.ReactNode }) => children,
  Screen: () => null,
}));
