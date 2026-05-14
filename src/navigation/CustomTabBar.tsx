import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography } from '../theme/tokens';
import type { MainStackParamList } from './types';
import { getTabConfig, isFabSlot, renderIndexToRouteIndex, FAB_SIZE, FAB_OFFSET, TAB_BAR_HEIGHT, resolveFabNavRoute } from './tabBarConfig';

// 컷아웃 FAB 커스텀 탭바 — react-navigation tabBar prop에 주입
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  // MainStack 네비게이터에 접근해 RecordingModal로 이동 (타입 안전)
  const parentNavigation = useNavigation<StackNavigationProp<MainStackParamList>>();

  // U3: 마이크 권한 체크 후 RecordingModal 이동 (가드레일: 사용자 명시 액션 없이 녹음 시작 금지)
  const onFabPress = async () => {
    let granted = false;
    if (Platform.OS === 'ios') {
      const current = await check(PERMISSIONS.IOS.MICROPHONE);
      if (current === RESULTS.GRANTED) {
        granted = true;
      } else {
        const result = await request(PERMISSIONS.IOS.MICROPHONE);
        granted = result === RESULTS.GRANTED;
      }
    } else {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
        title: '마이크 권한 필요',
        message: '녹음을 위해 마이크 접근 권한이 필요합니다.',
        buttonPositive: '허용',
        buttonNegative: '거부',
      });
      granted = result === PermissionsAndroid.RESULTS.GRANTED;
    }

    const route = resolveFabNavRoute(granted);
    if (route === 'permission_denied') {
      Alert.alert('권한 필요', '마이크 권한이 필요합니다. 설정에서 허용해주세요.');
      return;
    }
    parentNavigation.navigate(route);
  };

  const renderTabCell = (routeIndex: number, renderIndex: number) => {
    const route = state.routes[routeIndex];
    const { options } = descriptors[route.key];
    const isFocused = state.index === routeIndex;
    const config = getTabConfig(routeIndex);

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
      }
    };

    return (
      <TouchableOpacity
        key={`tab-${renderIndex}`}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? config.label}
        onPress={onPress}
        style={styles.tabCell}
      >
        <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{config.icon}</Text>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{config.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* 컷아웃 FAB — 탭바 위에 절대 위치 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="녹음 시작"
      >
        <Text style={styles.fabIcon}>🎙</Text>
      </TouchableOpacity>

      {/* 탭바 본체: isFabSlot으로 렌더 위치 결정 */}
      <View style={styles.tabBar}>
        {[0, 1, 2, 3, 4].map((renderIndex) =>
          isFabSlot(renderIndex) ? (
            <View key="fab-placeholder" style={styles.fabPlaceholder} />
          ) : (
            renderTabCell(renderIndexToRouteIndex(renderIndex), renderIndex)
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    alignItems: 'center',
  },
  tabCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  fabPlaceholder: {
    width: FAB_SIZE + spacing.xl,
  },
  fab: {
    position: 'absolute',
    top: -FAB_OFFSET,
    alignSelf: 'center',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.recordingRed,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.recordingRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  fabIcon: { fontSize: 26 },
  tabIcon: { fontSize: 20, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  tabLabelActive: { color: colors.accentBlue, fontWeight: '600' },
});
