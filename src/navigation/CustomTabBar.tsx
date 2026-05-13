import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography } from '../theme/tokens';
import { getTabConfig, isFabSlot, FAB_SIZE, FAB_OFFSET, TAB_BAR_HEIGHT } from './tabBarConfig';

// 컷아웃 FAB 커스텀 탭바 — react-navigation tabBar prop에 주입
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  // FAB 탭 → RecordingModal (Modal Stack, 탭 활성 상태 변경 없음)
  const onFabPress = () => {
    navigation.navigate('RecordingModal' as never);
  };

  const renderTabCell = (routeIndex: number) => {
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
        key={route.key}
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

      {/* 탭바 본체: 왼쪽 2탭 + FAB 빈 슬롯 + 오른쪽 2탭 */}
      <View style={styles.tabBar}>
        {renderTabCell(0)}
        {renderTabCell(1)}
        <View style={styles.fabPlaceholder} />
        {renderTabCell(2)}
        {renderTabCell(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
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
    left: '50%',
    marginLeft: -(FAB_SIZE / 2),
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
