import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList, BottomTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';
import { RecordingListScreen } from '../features/recordings/recordingListScreen';
import { RecordingDetailScreen } from '../features/recordings/recordingDetailScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { RecordingScreen } from '../features/recording-session/RecordingScreen';
import { colors } from '../theme/tokens';

const Tab = createBottomTabNavigator<BottomTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// BottomTabs: 4개 탭 (FAB는 CustomTabBar에서 주입)
function BottomTabs(): React.ReactElement {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={RecordingListScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// MainStack: BottomTabs + Detail/Transcript/RecordingModal
export function MainStack(): React.ReactElement {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen
        name="RecordingDetail"
        component={RecordingDetailScreen}
        options={{ headerShown: true, title: '녹음 상세' }}
      />
      <Stack.Screen
        name="Transcript"
        component={() => null}
      />
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
