// src/navigation/AuthStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';
import { LandingScreen } from './LandingScreen';
import { LoginScreen } from '../features/auth/loginScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { PermissionPrimerScreen } from '../features/onboarding/PermissionPrimerScreen';
import { BiometricEnrollmentScreen } from '../features/auth/BiometricEnrollmentScreen';

const Stack = createStackNavigator<AuthStackParamList>();

// 비인증 스택 — Landing → Onboarding → PermissionPrimer → BiometricEnrollment → Login 플로우
export function AuthStack(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PermissionPrimer" component={PermissionPrimerScreen} />
      <Stack.Screen name="BiometricEnrollment" component={BiometricEnrollmentScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}
