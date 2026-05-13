import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthGate } from './AuthGate';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';

// 앱 진입점 — NavigationContainer + AuthGate로 인증 상태에 따라 스택 전환
export function AppNavigator(): React.ReactElement {
  return (
    <NavigationContainer>
      <AuthGate
        authStack={<AuthStack />}
        mainStack={<MainStack />}
      />
    </NavigationContainer>
  );
}
