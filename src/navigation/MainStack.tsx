import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainStackParamList } from './types';
import { RecordingListScreen } from '../features/recordings/recordingListScreen';
import { RecordingDetailScreen } from '../features/recordings/recordingDetailScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { RecordingScreen } from '../features/recording-session/RecordingScreen';
import { TranscriptScreen } from '../features/transcript/TranscriptScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { colors } from '../theme/tokens';

const Stack = createStackNavigator<MainStackParamList>();

export function MainStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={RecordingListScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Settings" component={ProfileScreen} />
      <Stack.Screen name="RecordingDetail" component={RecordingDetailScreen} />
      <Stack.Screen name="Transcript" component={TranscriptScreen} />
      <Stack.Screen
        name="RecordingModal"
        component={RecordingScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
}
