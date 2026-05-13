import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, spacing, typography } from '../theme/tokens';
import type { MainStackParamList } from './types';
import { getTabConfig, isFabSlot, renderIndexToRouteIndex, FAB_SIZE, FAB_OFFSET, TAB_BAR_HEIGHT } from './tabBarConfig';

// 컷아웃 FAB 커스텀 탭바 — react-navigation tabBar prop에 주입
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  // MainStack 네비게이터에 접근해 RecordingModal로 이동 (타입 안전)
  const parentNavigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const onFabPress = () => {
    parentNavigation.navigate('RecordingModal');
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
