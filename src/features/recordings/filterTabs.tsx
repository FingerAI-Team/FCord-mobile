import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FilterType } from '../../types';
import { colors, radius, spacing } from '../../theme/tokens';

const TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'processing', label: '변환중' },
  { key: 'done', label: '완료' },
  { key: 'starred', label: '즐겨찾기' },
];

interface Props {
  active: FilterType;
  counts?: Partial<Record<FilterType, number>>;
  onChange: (filter: FilterType) => void;
  style?: ViewStyle; // 부모 controlRow에서 flex: 1 주입 가능
}

// Toss식 pill 세그먼트: 회색 트랙 위에 활성 탭만 IBK 블루 pill로 채움.
// 색만으로 구분하지 않도록 활성 탭은 weight + 색 + 채움 3중 신호 (가드레일).
export function FilterTabs({ active, counts, onChange, style }: Props): React.ReactElement {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label}${count != null ? `, ${count}건` : ''}`}
          >
            <Text
              style={[styles.label, isActive && styles.activeLabel]}
              numberOfLines={1}
            >
              {tab.label}
              {count != null && count > 0 ? `  ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.trackGray, // #F2F4F6 Toss gray
    borderRadius: radius.full,
    padding: spacing.xs, // 4 — 트랙 안쪽 여백
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary, // #585f6c
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.onPrimary, // #fff
    fontWeight: '700',
  },
});
