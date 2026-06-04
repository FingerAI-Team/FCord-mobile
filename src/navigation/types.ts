// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Landing: undefined;
  Onboarding: undefined;
  PermissionPrimer: undefined;
  BiometricEnrollment: undefined;
  Login: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Home: undefined;
  Library: undefined;
  Settings: undefined;
  RecordingDetail: { id: string; queueId?: string };
  Transcript: { id: string };
  RecordingModal: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
