import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Profile: undefined;
};

// RecordingModal은 MainStack 내부 modal로 처리
export type MainStackParamList = {
  Tabs: NavigatorScreenParams<BottomTabParamList>;
  RecordingDetail: { id: string };
  Transcript: { id: string };
  RecordingModal: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};
